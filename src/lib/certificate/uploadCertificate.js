import cloudinary from "@/lib/cloudinary";

export function uploadCertificateBuffer(buffer, bookingId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw", // PDFs must upload as 'raw' on Cloudinary
        folder: "rantraa/certificates",
        public_id: `certificate-${bookingId}`,
        format: "pdf",
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}