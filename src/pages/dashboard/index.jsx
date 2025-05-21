import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import Swal from "sweetalert2";
import * as Api from "@/services/api";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { loadUser } from "@/store/reducers/auth";
import makeSlice from "@/modules/crypto/makeSlice";
import { useDispatch, useSelector } from "react-redux";
import { useHandleError } from "@/services/useHandleError";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { ArrowBigRightDash, CalendarRange, Files, NotebookPen } from "lucide-react";

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

const Dashboard = () => {
    const [dashboardItems, setDashboardItems] = useState({});

    const user = useSelector(state => state.auth.currentUser);

    const [imgSrc, setImgSrc] = useState(`${process.env.NEXT_PUBLIC_URL}/Foto_Karyawan/${user.image}`);
    const fallbackImg = "/verifikasi-lab-isl/img-thumbnail.png";

    const dispatch = useDispatch();
    const { handleError } = useHandleError();

    const controller = "VerifikasiLabISLController";

    useEffect(() => {
        (async () => {
            try {
                const response = await Api.getProfile();

                dispatch(loadUser(response));
            } catch (error) {
                handleError(error);
            }
        })();

        (async () => {
            try {
                const response = await Api.fetchGet({}, makeSlice(controller, "dashboard"));

                if (response) {
                    setDashboardItems(response);
                } else {
                    Toast.fire({ icon: "error", title: "Terjadi kesalahan" });
                }
            } catch (error) {
                handleError(error);
            }
        })();
    }, []);

    return (
        <>
            <Head>
                <title>Dashboard | ISL</title>
            </Head>

            <div className="wrapper">
                <Header />

                <Container className="container">
                    <Row className="g-3 mb-4">
                        <Col xs={12}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h4 className="mb-0">Dashboard</h4>

                                <Link href="/samples" className="text-decoration-none">
                                    <Button variant="secondary" size="sm" className="d-flex align-items-center">
                                        <span className="me-2">Samples</span>
                                        <ArrowBigRightDash size={17} />
                                    </Button>
                                </Link>
                            </div>
                            <Card>
                                <Card.Body className="d-flex align-items-center">
                                    <Image src={imgSrc} width={80} height={80} alt="Avatar" className="img-thumbnail rounded-circle me-3" priority style={{ width: "80px", height: "80px", objectFit: "cover" }} onError={() => setImgSrc(fallbackImg)} />

                                    <div>
                                        <h6 className="mb-0">{user.name}</h6>
                                        <hr className="my-2" />
                                        <small>{user.pos}</small>
                                        <br />
                                        <small>{user.dept}</small>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                    <div className="d-flex justify-content-end align-items-center mb-3">
                        <CalendarRange size={15} className="me-2" />
                        <h6 className="mb-0">{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h6>
                    </div>
                    <Row className="g-3 mb-4">
                        <Col xs={6}>
                            <Card>
                                <Card.Body className="d-flex align-items-center">
                                    <NotebookPen size={40} className="me-3" />

                                    <div>
                                        <h6 className="mb-0">Hari ini</h6>
                                        <hr className="my-2" />
                                        <small>{dashboardItems?.today} Sampel</small>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={6}>
                            <Card>
                                <Card.Body className="d-flex align-items-center">
                                    <Files size={40} className="me-3" />

                                    <div>
                                        <h6 className="mb-0">Bulan ini</h6>
                                        <hr className="my-2" />
                                        <small>{dashboardItems?.thisMonth} Sampel</small>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>

                <Navbar />
            </div>
        </>
    );
};

export default Dashboard;
