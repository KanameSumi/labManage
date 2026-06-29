const backendUrl = process.env.API_BACKEND_URL || "http://host.docker.internal:8000";

module.exports = {
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: `${backendUrl}/api/:path*/`,
            },
        ];
    },
};