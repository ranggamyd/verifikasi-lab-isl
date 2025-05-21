import Head from "next/head";
import Link from "next/link";
import Swal from "sweetalert2";
import Image from "next/image";
import { useEffect } from "react";
import { LogIn } from "lucide-react";
import * as Api from "@/services/api";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { loadUser, loginUser } from "@/store/reducers/auth";
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";

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

const Login = () => {
    const router = useRouter();
    const dispatch = useDispatch();

    useEffect(() => {
        (async () => {
            const response = await Api.getProfile();

            if (response) {
                dispatch(loadUser(response));
                router.push("/dashboard");
            }
        })();
    }, []);

    const handleLogin = async (identity, password) => {
        try {
            const response = await Api.authLogin(identity, password, "login");
            Toast.fire({ icon: "success", title: "Signed in successfully" });

            dispatch(loginUser(response.token));
            router.push("/dashboard");
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            if (message === "User sudah login") {
                const alert = await Swal.fire({
                    icon: "question",
                    title: "User sudah login. Lanjutkan login?",
                    showCancelButton: true,
                    confirmButtonText: "Ya, lanjutkan",
                    cancelButtonText: "Tidak",
                });

                if (alert.isConfirmed) {
                    const response = await Api.authLogin(identity, password, "destroy_session");
                    Toast.fire({ icon: "success", title: "Signed in successfully" });

                    dispatch(loginUser(response.token));
                    router.push("/dashboard");
                }
            } else {
                Toast.fire({ icon: "error", title: message ?? "Login failed" });
            }
        }
    };

    return (
        <>
            <Head>
                <title>Login | ISL</title>
            </Head>

            <section className="vh-100 d-flex align-items-center">
                <Container style={{ paddingBottom: 0 }}>
                    <Row className="justify-content-center">
                        <Col xxl={4} xl={5}>
                            <div className="text-center mb-3">
                                <Image src="/verifikasi-lab-isl/isl_logo.png" width={165} height={50} alt="ISL Logo" priority style={{ objectFit: "cover" }} />
                            </div>
                            <Card className="shadow-lg">
                                <Card.Body>
                                    <h5 className="mb-4 text-center">Masuk untuk melanjutkan</h5>
                                    <Form
                                        onSubmit={e => {
                                            e.preventDefault();

                                            handleLogin(e.target.username.value, e.target.password.value);
                                        }}
                                    >
                                        <Form.Group className="mb-3">
                                            <Form.Label htmlFor="username">Username</Form.Label>
                                            <Form.Control type="text" name="username" id="username" required autoFocus />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <div className="w-100">
                                                <Form.Label htmlFor="password">Password</Form.Label>
                                                <a className="float-end" style={{ pointerEvents: "none" }}>
                                                    Forgot Password?
                                                </a>
                                            </div>
                                            <Form.Control type="password" name="password" id="password" required />
                                        </Form.Group>
                                        <Form.Group className="d-flex align-items-center">
                                            <Form.Check inline type="checkbox" name="remember" label="Remember Me" id="inline-checkbox-1" checked />
                                            <Button variant="primary" type="submit" className="ms-auto">
                                                Masuk <LogIn size={16} />
                                            </Button>
                                        </Form.Group>
                                    </Form>
                                </Card.Body>
                                <Card.Footer className="py-3 border-0 text-center">
                                    {`Don't have an account? `}
                                    <a className="ml-2" style={{ pointerEvents: "none" }}>
                                        Create one!
                                    </a>
                                </Card.Footer>
                            </Card>
                            <div className="text-center mt-5 text-muted">Copyright &copy; 2025 — Inti Surya Laboratorium, PT</div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </>
    );
};

export default Login;
