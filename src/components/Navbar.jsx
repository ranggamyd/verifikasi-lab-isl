import Link from "next/link";
import Swal from "sweetalert2";
import QrScanner from "qr-scanner";
import { Nav } from "react-bootstrap";
import * as Api from "@/services/api";
import { Button, Modal } from "react-bootstrap";
import makeSlice from "@/modules/crypto/makeSlice";
import { useEffect, useRef, useState } from "react";
import { useHandleError } from "@/services/useHandleError";
import { FileText, Home, QrCode, SwitchCamera, X } from "lucide-react";
import QRScannerModal from "@/pages/samples/QrScannerModal";

const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: toast => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    },
});

const Navbar = () => {
    const scannerRef = useRef(null);
    const videoRef = useRef(null);

    const [showScanner, setShowScanner] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [currentCamera, setCurrentCamera] = useState("environment");
    const [isFetchingSample, setIsFetchingSample] = useState(false);

    const [noSampel, setNoSampel] = useState("");

    const { handleError } = useHandleError();

    const controller = "VerifikasiLabISLController";

    const initializeScanner = async () => {
        try {
            if (!videoRef.current) return;

            if (scannerRef.current) {
                scannerRef.current.destroy();
            }

            const availableCameras = await QrScanner.listCameras();
            setCameras(availableCameras);

            const scanner = new QrScanner(
                videoRef.current,
                result => {
                    setNoSampel(result.data);
                    setIsFetchingSample(true);
                    setShowScanner(false);
                    scanner.destroy();
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
                title: "Harap memberikan izin kamera terlebih dahulu",
            });
            console.error("Scanner initialization error:", error);
        }
    };

    useEffect(() => {
        if (showScanner) {
            initializeScanner();
            window.history.pushState(null, "", window.location.href);

            const handleBackButton = () => {
                setShowScanner(false);
            };

            window.addEventListener("popstate", handleBackButton);

            return () => {
                window.removeEventListener("popstate", handleBackButton);
                if (scannerRef.current) {
                    scannerRef.current.destroy();
                }
            };
        }
    }, [showScanner, currentCamera]);

    const toggleCamera = async () => {
        if (cameras.length > 1) {
            const newCamera = currentCamera === "environment" ? "user" : "environment";
            setCurrentCamera(newCamera);
        } else {
            Toast.fire({
                icon: "error",
                title: "Hanya satu kamera yang tersedia",
            });
        }
    };

    useEffect(() => {
        if (noSampel) {
            (async () => {
                Swal.fire({
                    title: "Loading...",
                    text: "Harap tunggu",
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    },
                });

                try {
                    const response = await Api.fetchGet({ no_sampel: noSampel }, makeSlice(controller, "store"));

                    if (response.status == 200) {
                        Toast.fire({ icon: "success", title: response.message });
                    } else {
                        setNoSampel("");
                        Toast.fire({ icon: "error", title: response.message || "Terjadi kesalahan" });
                    }
                } catch (error) {
                    setNoSampel("");
                    handleError(error);
                }
            })();
        }
    }, [noSampel]);

    return (
        <>
            <a className="fab" onClick={() => setShowScanner(true)}>
                <QrCode size={24} />
            </a>

            <Nav className="bottom-nav justify-content-around">
                <Link href="/dashboard" className="nav-item">
                    <Home size={20} />
                    <span>Home</span>
                </Link>

                <Link href="/samples" className="nav-item">
                    <FileText size={20} />
                    <span>Samples</span>
                </Link>
            </Nav>

            <QRScannerModal
                show={showScanner}
                onHide={() => setShowScanner(false)}
            />
        </>
    );
};

export default Navbar;
