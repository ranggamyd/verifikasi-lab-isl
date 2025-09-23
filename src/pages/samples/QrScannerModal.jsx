import { useEffect, useRef, useState } from "react";
import { Modal, Button, Form, Card } from "react-bootstrap";
import QrScanner from "qr-scanner";
import Swal from "sweetalert2";
import { QrCode, SwitchCamera, X } from "lucide-react";
import * as Api from "@/services/api";
import makeSlice from "@/modules/crypto/makeSlice";
import { useHandleError } from "@/services/useHandleError";

// 🔔 Custom toast
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

const QRScannerModal = ({ show, onHide }) => {
  const scannerRef = useRef(null);
  const videoRef = useRef(null);

  const [cameras, setCameras] = useState([]);
  const [currentCamera, setCurrentCamera] = useState("environment");
  const [scannedValue, setScannedValue] = useState("");
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [dataBottles, setDataBottles] = useState([]);
  const [noSampel, setNoSampel] = useState("");
  const [activeBottle, setActiveBottle] = useState(null);

  const { handleError } = useHandleError();
  const controller = "VerifikasiLabISLController";

  // 🔹 Inisialisasi & cleanup scanner
  useEffect(() => {
    if (!show) stopScanner();
    return () => stopScanner();
  }, [show]);

  useEffect(() => {
    if (isScannerActive) initializeScanner();
    else stopScanner();
  }, [isScannerActive, currentCamera]);

  // 🔹 Initialize scanner
  const initializeScanner = async () => {
    try {
      if (!videoRef.current) return;
      stopScanner();

      const availableCameras = await QrScanner.listCameras();
      setCameras(availableCameras);

      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          setScannedValue(result.data);
          setIsScannerActive(false);
          stopScanner();
          checkBottleData(result.data); // langsung cek botol
        },
        {
          returnDetailedScanResult: true,
          preferredCamera: currentCamera,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      await scanner.start();
      scannerRef.current = scanner;
    } catch (error) {
      Toast.fire({ icon: "error", title: "Please grant camera permission" });
      setIsScannerActive(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
  };

  // 🔹 Switch kamera
  const toggleCamera = () => {
    if (cameras.length > 1) {
      setCurrentCamera((prev) =>
        prev === "environment" ? "user" : "environment"
      );
    } else {
      Toast.fire({ icon: "error", title: "Only one camera available" });
    }
  };

  // 🔹 Tutup modal
  const handleClose = () => {
    setIsScannerActive(false);
    setScannedValue("");
    setDataBottles([]);
    setNoSampel("");
    setActiveBottle(null);
    onHide();
  };

  // 🔹 Cek data botol
  const checkBottleData = async (value) => {
    Swal.fire({
      title: "Loading...",
      text: "Harap tunggu sedang mengecek daftar botol",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const response = await Api.fetchGet(
        { no_sampel: value },
        makeSlice(controller, "checkBottle2")
      );

      if (response.status === "200") {
        setNoSampel(response.no_sampel);

        // merge data lama dengan response baru
        setDataBottles((prev) => {
          let initialData =
            prev.length > 0 && noSampel === response.no_sampel
              ? prev
              : response.data_scan;

          const combined = [...initialData];

          response.data_botol.forEach((newItem) => {
            const idx = combined.findIndex((item) => item.koding === newItem.koding);
            if (idx !== -1) {
              const existing = combined[idx];
              combined[idx] = {
                ...existing,
                ...newItem,
                jumlah:
                  existing.jumlah >= existing.disiapkan
                    ? existing.disiapkan
                    : (parseInt(existing.jumlah) || 0) +
                      (parseInt(newItem.add) || 0),
              };
            } else {
              combined.push({ ...newItem, jumlah: 0 });
            }
          });

          return combined;
        });

        setActiveBottle(response.data_botol[0]?.koding || null);
        Toast.fire({ icon: "success", title: response.message });
      } else {
        resetState();
        Toast.fire({ icon: "error", title: response.message || "Terjadi kesalahan" });
      }
    } catch (error) {
      resetState();
      handleError(error);
    }
  };

  const resetState = () => {
    setNoSampel("");
    setDataBottles([]);
  };

  // 🔹 Submit data botol
  const handleSubmitData = async () => {
    try {
      const response = await Api.fetchPost(
        { no_sampel: noSampel, data_botol: dataBottles, scanned_data: scannedValue },
        makeSlice(controller, "storeBottle")
      );

      if (response.status === "201") {
        Toast.fire({ icon: "success", title: response.message });
        handleClose();
        window.location.reload();
      } else {
        Toast.fire({ icon: "error", title: response.message || "Terjadi kesalahan" });
      }
    } catch (error) {
      Toast.fire({ icon: "error", title: error.message || "Terjadi kesalahan" });
    }
  };

  // 🔹 Ambil label botol
  const getBottleLabel = (bottle) =>
    typeof bottle.jenis_botol === "object"
      ? bottle.jenis_botol.parameter
      : bottle.jenis_botol || bottle.type_botol || bottle.parameter || "-";

  // 🔹 Cek ready
  const isReady = (bottle) =>
    bottle.disiapkan &&
    bottle.jumlah &&
    bottle.disiapkan.toString() === bottle.jumlah.toString();

  return (
    <>
      {/* Modal Input */}
      <Modal show={show} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add Sampel</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Input No Sampel */}
          <Form.Group className="mb-3">
            <Form.Label>No Sampel</Form.Label>
            <div className="d-flex">
              <Form.Control
                type="text"
                value={scannedValue}
                onChange={(e) => setScannedValue(e.target.value)}
                onBlur={() => scannedValue.trim() && checkBottleData(scannedValue)}
                placeholder="Enter sample number or scan QR code"
              />
              <Button variant="outline-primary" onClick={() => setIsScannerActive(true)} className="ms-2">
                <QrCode size={16} />
              </Button>
            </div>
          </Form.Group>

          {/* List Botol */}
          {dataBottles.length > 0 && (
            <>
              <div className="row">
                {dataBottles.map((bottle, index) => (
                  <div key={index} className="col-6 text-center mb-3">
                    <Card
                      onClick={() => setActiveBottle(bottle.koding)}
                      className={`h-100 ${isReady(bottle) ? "bottle-ready" : "bottle-not-ready"}`}
                    >
                      <Card.Body>
                        <Card.Title>{getBottleLabel(bottle)}</Card.Title>
                        {!(bottle.kategori === "4-Udara" || bottle.kategori === "5-Emisi") && (
                          <Card.Text>
                            <strong>Jumlah:</strong> {bottle.jumlah}
                            <br />
                            <strong>Disiapkan:</strong> {bottle.disiapkan || "-"}
                          </Card.Text>
                        )}
                      </Card.Body>
                    </Card>
                  </div>
                ))}
              </div>

              {/* Input Jumlah */}
              {activeBottle && scannedValue.includes("/") && (
                <Form.Group className="mb-3">
                  {dataBottles
                    .filter((b) => b.koding === activeBottle)
                    .map((b, idx) => (
                      <div key={idx}>
                        <Form.Label>
                          Jumlah Disiapkan <b>{getBottleLabel(b)}</b>
                        </Form.Label>
                        <Form.Control
                          type="number"
                          value={b.jumlah || ""}
                          onChange={(e) =>
                            setDataBottles((prev) =>
                              prev.map((x) =>
                                x.koding === b.koding ? { ...x, jumlah: parseInt(e.target.value) || 0 } : x
                              )
                            )
                          }
                          min="0"
                          max={b.disiapkan}
                        />
                        <Form.Text>Jumlah yang harus disiapkan: {b.disiapkan}</Form.Text>
                      </div>
                    ))}
                </Form.Group>
              )}
            </>
          )}

          {/* Action */}
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="danger" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmitData} disabled={!scannedValue.trim()}>
              Submit
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Fullscreen Scanner */}
      {isScannerActive && (
        <div
          className="scanner-overlay"
          style={{ position: "fixed", inset: 0, backgroundColor: "black", zIndex: 9999 }}
        >
          <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <Button
            variant="outline-secondary"
            onClick={() => setIsScannerActive(false)}
            style={{ position: "absolute", top: 20, right: 20, zIndex: 10000 }}
          >
            <X size={25} />
          </Button>
          <Button
            variant="outline-light"
            size="lg"
            onClick={toggleCamera}
            style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 10000 }}
          >
            <SwitchCamera size={25} />
            <span className="ms-2">Switch Camera</span>
          </Button>
        </div>
      )}
    </>
  );
};

export default QRScannerModal;
