export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);

  // Append to DOM, required for iOS Safari to respect the click
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export const shareAPISupported =
  typeof navigator !== 'undefined' &&
  typeof navigator.share === 'function' &&
  typeof navigator.canShare === 'function';

export async function shareFile(file: File) {
  if (!shareAPISupported) {
    throw new Error('Web Share API is not supported');
  }

  if (!navigator.canShare({ files: [file] })) {
    throw new Error('Unable to share the file');
  }

  try {
    await navigator.share({ files: [file] });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return; // User cancelled — not a real error
    }
    throw err;
  }
}
