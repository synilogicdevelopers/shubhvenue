// Utility function to load Razorpay script
export const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (window.Razorpay) {
      resolve();
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      // Wait for it to load
      existingScript.addEventListener('load', resolve);
      existingScript.addEventListener('error', reject);
      return;
    }

    // Create and append script
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
};




