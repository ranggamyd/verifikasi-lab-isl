import Head from "next/head";
import Swal from "sweetalert2";
import QrScanner from "qr-scanner";
import * as Api from "@/services/api";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import makeSlice from "@/modules/crypto/makeSlice";
import { useEffect, useRef, useState } from "react";
import { useHandleError } from "@/services/useHandleError";
import { QrCode, SwitchCamera, Trash2, X } from "lucide-react";
import { Container, Row, Col, Card, Button, Modal } from "react-bootstrap";

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

const Samples = () => {
    const [sampleList, setSampleList] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const scannerRef = useRef(null);
    const videoRef = useRef(null);

    const [showScanner, setShowScanner] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [currentCamera, setCurrentCamera] = useState("environment");
    const [isFetchingSample, setIsFetchingSample] = useState(false);
    const [noSampel, setNoSampel] = useState("");

    const { handleError } = useHandleError();
    const controller = "VerifikasiLabISLController";

    const fetchSamples = async (page = 1, append = false) => {
        setIsLoading(true);
        try {
            const response = await Api.fetchGet({ page }, makeSlice(controller, "index"));

            if (response.data) {
                if (response.length === 0) {
                    setHasMore(false);
                } else {
                    setSampleList(prev => (append ? [...prev, ...response.data] : response.data));
                }
            } else {
                Toast.fire({ icon: "error", title: "Terjadi kesalahan" });
            }
        } catch (error) {
            handleError(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSamples(1);
    }, []);

    useEffect(() => {
        if (page > 1) fetchSamples(page, true);
    }, [page]);

    useEffect(() => {
        const handleScroll = () => {
            const bottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
            if (bottom && hasMore && !isLoading) {
                setPage(prev => prev + 1);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [hasMore, isLoading]);

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
                        fetchSamples(1);
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
            <Head>
                <title>Daftar Sampel | ISL</title>
                <style jsx global>{`
                    .qr-scanner-region {
                        border: 2px solid #fff !important;
                        border-radius: 10px !important;
                    }
                    .qr-scanner-region > div {
                        border: 2px solid #00ff00 !important;
                    }
                `}</style>
            </Head>

            <div className="wrapper">
                <Header />

                <Container className="container">
                    <Row className="g-3 mb-4">
                        <Col xs={12}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h4 className="mb-0">Daftar Sampel</h4>
                                <Button variant="primary" size="sm" onClick={() => setShowScanner(true)} className="d-flex align-items-center">
                                    <QrCode size={17} />
                                    <span className="ms-2">Scan QR</span>
                                </Button>
                            </div>

                            {sampleList.map((sample, index) => (
                                <Card className="mb-3" key={index}>
                                    <Card.Body className="d-flex align-items-center">
                                        <div className="ps-3">
                                            <p className="mb-2">
                                                No. Sampel : <span className="fw-normal">{sample.no_sample}</span>
                                            </p>
                                            <hr className="my-2" />
                                            <p className="mb-1">
                                                By : {sample.nama_lengkap} <br />
                                                <small>
                                                    {new Date(sample.ftc_laboratory).toLocaleString("en-US", {
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </small>
                                            </p>
                                        </div>
                                    </Card.Body>
                                </Card>
                            ))}

                            {isLoading && (
                                <div className="text-center my-3">
                                    <span>Loading more samples...</span>
                                </div>
                            )}
                        </Col>
                    </Row>
                </Container>

                <Navbar />

                <Modal
                    show={showScanner}
                    fullscreen
                    onHide={() => {
                        setShowScanner(false);
                        window.history.pushState(null, "", window.location.href);
                    }}
                >
                    <Modal.Body className="p-0" style={{ position: "fixed", width: "100%", height: "100dvh" }}>
                        <video ref={videoRef} style={{ width: "100%", height: "100dvh", objectFit: "cover" }}></video>
                        <Button variant="outline-secondary" className="d-flex align-items-center" onClick={() => setShowScanner(false)} style={{ position: "absolute", top: "10px", right: "10px" }}>
                            <X size={25} />
                        </Button>
                        <Button
                            variant="outline-light"
                            size="lg"
                            className="d-flex align-items-center"
                            onClick={toggleCamera}
                            style={{
                                position: "absolute",
                                bottom: "10px",
                                left: "50%",
                                transform: "translateX(-50%)",
                            }}
                        >
                            <SwitchCamera size={25} />
                            <span className="ms-2">Switch Camera</span>
                        </Button>
                    </Modal.Body>
                </Modal>
            </div>
        </>
    );
};

export default Samples;
