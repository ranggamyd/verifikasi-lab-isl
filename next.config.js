/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    basePath: "/verifikasi-lab-isl",
    assetPrefix: "/verifikasi-lab-isl",
    output: "export",
    images: {
        unoptimized: true,
    },

    async redirects() {
        return [
            {
                source: "/",
                destination: "/auth/login",
                permanent: true,
            },
        ];
    },
};

module.exports = nextConfig;
