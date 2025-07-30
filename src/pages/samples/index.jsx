import Head from "next/head";
import Swal from "sweetalert2";
import * as Api from "@/services/api";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import QRScannerModal from "@/pages/samples/QrScannerModal";
import makeSlice from "@/modules/crypto/makeSlice";
import { useEffect, useState } from "react";
import { useHandleError } from "@/services/useHandleError";
import { Plus, QrCode } from "lucide-react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";

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
    const [showQRModal, setShowQRModal] = useState(false);
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

    const handleScanResult = (scannedValue) => {
        setNoSampel(scannedValue);
        setIsFetchingSample(true);
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
                } finally {
                    Swal.close();
                    setIsFetchingSample(false);
                }
            })();
        }
    }, [noSampel]);

    return (
		<>
			<Head>
				<title>Daftar Sampel | ISL</title>
			</Head>

			<div className="wrapper">
				<Header />

				<Container className="container">
					<Row className="g-3 mb-4">
						<Col xs={12}>
							<div className="d-flex justify-content-between align-items-center mb-3">
								<h4 className="mb-0">Daftar Sampel</h4>
								<Button variant="primary" size="sm" onClick={() => setShowQRModal(true)} className="d-flex align-items-center">
									<Plus size={17} />
									<span className="ms-2">Add Sample</span>
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

				<QRScannerModal show={showQRModal} fetchSamples={fetchSamples} onHide={() => setShowQRModal(false)} />
			</div>
		</>
	);
};

export default Samples;