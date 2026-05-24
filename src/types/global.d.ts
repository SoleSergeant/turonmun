// Extend the Window interface to include gtag
declare global {
  interface Window {
    gtag: (
      command: string,
      action: string,
      config: {
        page_path: string;
        [key: string]: any;
      }
    ) => void;
  }
}

export {}; // This file needs to be a module
