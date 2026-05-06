const isUnoptimizedUrl = (url: string): boolean => {
  return url.startsWith("blob:") || url.startsWith("http://127.0.0.1:") || url.startsWith("http://localhost:")
}

export default isUnoptimizedUrl
