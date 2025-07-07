import { useEffect, useRef, useState } from "react";
import { Modal, Button, Form, Card } from "react-bootstrap";
import QrScanner from "qr-scanner";
import Swal from "sweetalert2";
import { QrCode, SwitchCamera, X } from "lucide-react";
import * as Api from "@/services/api";
import makeSlice from "@/modules/crypto/makeSlice";
import { useHandleError } from "@/services/useHandleError";

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
    const [isInputFocused, setIsInputFocused] = useState(false);

    const { handleError } = useHandleError();
    const controller = "VerifikasiLabISLController";

    // Initialize and cleanup scanner
    useEffect(() => {
        if (!show) {
            stopScanner();
            return;
        }

        return () => {
            stopScanner();
        };
    }, [show]);

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
                    // Langsung panggil checkBottleData setelah scan
                    checkBottleData(result.data);
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
            Toast.fire({
                icon: "error",
                title: "Please grant camera permission first",
            });
            console.error("Scanner initialization error:", error);
            setIsScannerActive(false);
        }
    };

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.destroy();
            scannerRef.current = null;
        }
    };

    useEffect(() => {
        if (isScannerActive) {
            initializeScanner();
        } else {
            stopScanner();
        }
    }, [isScannerActive, currentCamera]);

    const toggleCamera = async () => {
        if (cameras.length > 1) {
            setCurrentCamera((prev) =>
                prev === "environment" ? "user" : "environment"
            );
        } else {
            Toast.fire({
                icon: "error",
                title: "Only one camera available",
            });
        }
    };

    const handleClose = () => {
        setIsScannerActive(false);
        setScannedValue("");
        setDataBottles([]);
        setNoSampel("");
        setActiveBottle(null);
        onHide();
    };

    // const handleSubmit = () => {
    //     if (scannedValue.trim()) {
    //         onScanResult({
    //             noSampel,
    //             dataBottles,
    //             activeBottle
    //         });
    //         handleClose();
    //     } else {
    //         Toast.fire({
    //             icon: "error",
    //             title: "Please scan a QR code or enter a value manually",
    //         });
    //     }
    // };

    const handleScanQR = () => {
        setIsScannerActive(true);
    };

    const handleCloseScanner = () => {
        setIsScannerActive(false);
    };

    // useEffect(() => {
    //     // Hanya jalankan pengecekan ketika input tidak dalam fokus
    //     if (!isInputFocused && scannedValue.trim()) {
    //         checkBottleData(scannedValue);
    //     }
    // }, [scannedValue, isInputFocused]);

    const handleInputChange = (e, koding) => {
        const value = e.target.value;
        setDataBottles(prevBottles =>
            prevBottles.map(bottle =>
                bottle.koding === koding
                    ? { ...bottle, jumlah: parseInt(value) || 0 }
                    : bottle
            )
        );
    };

    const isReady = (bottle) => {
        return bottle.disiapkan && bottle.jumlah &&
            bottle.disiapkan.toString() === bottle.jumlah.toString();
    };

    const checkBottleData = async (value) => {
        Swal.fire({
            title: "Loading...",
            text: "Harap tunggu sedang mengecek daftar botol",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        try {
            const response = await Api.fetchGet({ no_sampel: value }, makeSlice(controller, "checkBottle"));

            if (response.status === "200") {
                setNoSampel(response.no_sampel);
                const bottlesWithDisiapkan = response.data_botol;

                setDataBottles((prevBottles) => {
                    let initialData = [];
                    if (prevBottles && prevBottles.length > 0 && noSampel === response.no_sampel) {
                        initialData = prevBottles;
                    } else {
                        initialData = response.data_scan;
                    }

                    const baseArray = initialData;

                    const combined = [...baseArray];


                    response.data_botol.forEach((newItem) => {
                        const key = newItem.koding;
                        const existingIndex = combined.findIndex((item) => item.koding === key);

                        if (existingIndex !== -1) {
                            const existing = combined[existingIndex];
                            // console.log("Updating existing:", existing, "with:", newItem);

                            combined[existingIndex] = {
                                ...existing,
                                ...newItem,
                                jumlah: (parseInt(existing.jumlah) || 0) + (parseInt(newItem.add) || 0),
                            };
                        } else {
                            // console.log("Adding new item:", newItem);
                            combined.push({ ...newItem, jumlah: 0 });
                        }
                    });
                    return combined;
                });
                setActiveBottle(bottlesWithDisiapkan[0]?.koding || null);
                Toast.fire({ icon: "success", title: response.message });
            } else {
                setNoSampel("");
                setDataBottles([]);
                Toast.fire({ icon: "error", title: response.message || "Terjadi kesalahan" });
            }
        } catch (error) {
            setNoSampel("");
            setDataBottles([]);
            handleError(error);
        } finally {
            Swal.close();
        }
    };

    const handleSubmitData = async () => {
        try {
            const response = await Api.fetchPost({ no_sampel: noSampel, data_botol: dataBottles, scanned_data: scannedValue }, makeSlice(controller, "storeBottle"));
            if (response.status === "201") {
                Toast.fire({ icon: "success", title: response.message });
                handleClose();
            } else {
                Toast.fire({ icon: "error", title: response.message || "Terjadi kesalahan", timer: 3000 });
            }
        } catch (error) {
            Toast.fire({ icon: "error", title: error.message || "Terjadi kesalahan", timer: 3000 });
        }
    }

    return (
        <>
            <style jsx global>{`
                .qr-scanner-region {
                    border: 2px solid #fff !important;
                    border-radius: 10px !important;
                }
                .qr-scanner-region > div {
                    border: 2px solid #00ff00 !important;
                }
                .bottle-ready {
                    background-color: #d4edda !important;
                    border-color: #c3e6cb !important;
                }
                .bottle-not-ready {
                    background-color:rgb(235, 241, 209) !important;
                    border-color: rgb(170, 177, 137)  !important;
                }
            `}</style>

            {/* Main Input Modal */}
            <Modal show={show} onHide={handleClose} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Add Sampel</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-3">
                        <Form.Group className="mb-3">
                            <Form.Label>No Sampel</Form.Label>
                            <div className="d-flex">
                                <Form.Control
                                    type="text"
                                    value={scannedValue}
                                    onChange={(e) => setScannedValue(e.target.value)}
                                    onFocus={() => setIsInputFocused(true)}
                                    onBlur={() => {
                                        setIsInputFocused(false);
                                        // Trigger check when leaving the field
                                        if (scannedValue.trim()) {
                                            checkBottleData(scannedValue);
                                        }
                                    }}
                                    placeholder="Enter sample number or scan QR code"
                                />
                                <Button
                                    variant="outline-primary"
                                    onClick={handleScanQR}
                                    className="d-flex align-items-center ms-2"
                                >
                                    <QrCode size={16} />
                                </Button>
                            </div>
                        </Form.Group>
                    </div>
                    {dataBottles && dataBottles.length > 0 && (
                        <>
                            <div className="mb-3">
                                <div className="row">
                                    {dataBottles.map((bottle, index) => (
                                        <div key={index} className="col-6 text-center mb-3">
                                            <Card
                                                onClick={() => setActiveBottle(bottle.koding)}
                                                className={`h-100 ${isReady(bottle) ? 'bottle-ready' : 'bottle-not-ready'}`}
                                            >
                                                <Card.Body>
                                                    <Card.Title>{bottle.jenis_botol}</Card.Title>
                                                    <Card.Text>
                                                        <strong>Jumlah:</strong> {bottle.jumlah}<br />
                                                        <strong>Disiapkan:</strong> {bottle.disiapkan || "-"}
                                                    </Card.Text>
                                                </Card.Body>
                                            </Card>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {activeBottle && scannedValue.includes('/') && (
                                <div className="mb-3">
                                    {dataBottles
                                        .filter(bottle => bottle.koding === activeBottle)
                                        .map((bottle, index) => (
                                            <Form.Group key={index} className="mb-3">
                                                <Form.Label>
                                                    Jumlah Disiapkan <span className="font-weight-bold">{bottle.jenis_botol}</span>
                                                </Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={bottle.jumlah || ""}
                                                    onChange={(e) => handleInputChange(e, bottle.koding)}
                                                    min="0"
                                                    max={bottle.disiapkan}
                                                    required
                                                />
                                                <Form.Text className="text-muted">
                                                    Jumlah yang harus disiapkan: {bottle.disiapkan}
                                                </Form.Text>
                                            </Form.Group>
                                        ))}
                                </div>
                            )}
                        </>
                    )}

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button variant="danger" onClick={handleClose}>Cancel</Button>
                        <Button variant="primary" onClick={handleSubmitData} disabled={!scannedValue.trim()}>
                            Submit
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Fullscreen Scanner Modal */}
            {isScannerActive && (
                <div className="scanner-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100vh',
                    backgroundColor: 'black',
                    zIndex: 9999
                }}>
                    <video
                        ref={videoRef}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                        }}
                    />
                    <Button
                        variant="outline-secondary"
                        className="d-flex align-items-center"
                        onClick={handleCloseScanner}
                        style={{
                            position: "absolute",
                            top: "20px",
                            right: "20px",
                            zIndex: 10000
                        }}
                    >
                        <X size={25} />
                    </Button>
                    <Button
                        variant="outline-light"
                        size="lg"
                        className="d-flex align-items-center"
                        onClick={toggleCamera}
                        style={{
                            position: "absolute",
                            bottom: "20px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            zIndex: 10000
                        }}
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