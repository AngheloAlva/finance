const MAX_LONG_EDGE = 1568
const JPEG_QUALITY = 0.85

// Claude reads images up to 1568px on the long edge at full quality, so larger
// phone photos only add upload time and cost. Re-encoding also turns HEIC photos
// into JPEG. If the browser cannot decode the file, it is sent as is and the API
// decides whether to accept it.
export async function prepareReceiptImage(file: File): Promise<File> {
	try {
		const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
		const scale = Math.min(1, MAX_LONG_EDGE / Math.max(bitmap.width, bitmap.height))

		const canvas = document.createElement("canvas")
		canvas.width = Math.round(bitmap.width * scale)
		canvas.height = Math.round(bitmap.height * scale)
		const context = canvas.getContext("2d")
		if (!context) return file

		context.fillStyle = "#ffffff"
		context.fillRect(0, 0, canvas.width, canvas.height)
		context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
		bitmap.close()

		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
		)

		return blob ? new File([blob], "receipt.jpg", { type: "image/jpeg" }) : file
	} catch {
		return file
	}
}
