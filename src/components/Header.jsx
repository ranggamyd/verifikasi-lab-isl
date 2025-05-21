import Link from "next/link";
import Image from "next/image";
import Swal from "sweetalert2";
import { LogOut } from "lucide-react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { Container } from "react-bootstrap";
import { logoutUser } from "@/store/reducers/auth";

const Header = () => {
    const dispatch = useDispatch();
    const router = useRouter();

    const handleLogout = async e => {
        const result = await Swal.fire({
            icon: "warning",
            title: "Apakah anda yakin?",
            showCancelButton: true,
            confirmButtonText: "Ya, lanjutkan",
            cancelButtonText: "Tidak",
        });

        if (result.isConfirmed) {
            e.preventDefault();

            Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: toast => {
                    toast.onmouseenter = Swal.stopTimer;
                    toast.onmouseleave = Swal.resumeTimer;
                },
            }).fire({ icon: "success", title: "You have been logged out" });

            dispatch(logoutUser());
            router.push("/auth/login");
        }
    };

    return (
        <div className="header bg-white shadow-sm mb-4">
            <Container className="py-3">
                <div className="d-flex justify-content-between align-items-center">
                    <Link href="/dashboard">
                        <Image src="/verifikasi-lab-isl/isl_logo.png" width={165} height={50} alt="ISL Logo" priority style={{ objectFit: "cover" }} />
                    </Link>
                    <button onClick={handleLogout} className="btn btn-light rounded-full">
                        <LogOut size={20} />
                    </button>
                </div>
            </Container>
        </div>
    );
};

export default Header;
