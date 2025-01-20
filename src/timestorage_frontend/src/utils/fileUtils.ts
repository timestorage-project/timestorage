export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const base64String = reader.result as string
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Content = base64String.split(',')[1]
      resolve(base64Content)
    }
    reader.onerror = error => reject(error)
  })
}

export const getFileMetadata = (file: File) => {
  return {
    fileName: file.name,
    mimeType: file.type,
    uploadTimestamp: BigInt(Date.now())
  }
}
