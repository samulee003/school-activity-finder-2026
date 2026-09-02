(function(){
  const nativeLoadData = loadData;
  function getCompressedBytes(){
    return Uint8Array.from(atob(window.__DATA_GZIP__ || ''), c => c.charCodeAt(0));
  }
  function loadPako(){
    if (window.pako) return Promise.resolve(window.pako);
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js';
      s.async=true;
      s.onload=()=>window.pako?resolve(window.pako):reject(new Error('pako unavailable'));
      s.onerror=()=>reject(new Error('pako load failed'));
      document.head.appendChild(s);
    });
  }
  loadData = async function(){
    try {
      return await nativeLoadData();
    } catch (nativeError) {
      console.warn('Native gzip decompression unavailable, using fallback.', nativeError);
      const pako = await loadPako();
      const jsonBytes = pako.ungzip(getCompressedBytes());
      return JSON.parse(new TextDecoder('utf-8').decode(jsonBytes));
    }
  };
})();
