import Swal from "sweetalert2";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { logoutUser } from "@/store/reducers/auth";

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

export const useHandleError = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const handleError = error => {
        if (error.code === 403) {
            Toast.fire({ icon: "error", title: error.message || "Akses tidak diberikan" })
            router.push("/auth/login");
            dispatch(logoutUser());
        } else {
            Toast.fire({ icon: "error", title: error.message || "Terjadi kesalahan" });
        }
    };

    return { handleError };
};
