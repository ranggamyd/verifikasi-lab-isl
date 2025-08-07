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
import { Container, Row, Col, Card, Button, Spinner } from "react-bootstrap";

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
					setSampleList((prev) => (append ? [...prev, ...response.data] : response.data));
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
				setPage((prev) => prev + 1);
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
								<Card className="mb-3 shadow-lg border-0" key={index}>
									<Card.Body className="d-flex flex-column">
										<div className="d-flex justify-content-between align-items-center mb-2">
											<h5 className="mb-0 text-primary">{sample.no_sampel}</h5>
											<span className={`badge px-3 py-2 rounded-pill text-uppercase ${sample.status === "belum_lengkap" ? "bg-danger" : "bg-success"}`}>{sample.status === "belum_lengkap" ? "Belum Lengkap" : "Lengkap"}</span>
										</div>

										<hr className="my-2" />

										<div className="text-muted small">
											<div>
												<strong>By:</strong> {sample.created_by}
											</div>
											<div>
												{new Date(sample.created_at).toLocaleString("en-US", {
													day: "numeric",
													month: "long",
													year: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</div>
										</div>
									</Card.Body>
								</Card>
							))}
						</Col>
					</Row>
					{isLoading && (
						<div className="text-center mx-auto my-3">
							<Spinner animation="border" variant="primary" size="sm" />
						</div>
					)}
				</Container>

				<Navbar />

				<QRScannerModal show={showQRModal} fetchSamples={fetchSamples} onHide={() => setShowQRModal(false)} />
			</div>
		</>
	);
};

export default Samples;