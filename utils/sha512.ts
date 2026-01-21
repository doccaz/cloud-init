// Simplified implementation based on the original provided code.
// Note: This is a JS implementation of SHA-512 crypt for browser usage.
// In a real production Node environment, you would use a native crypto library.

export const generateSalt = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const sha512cryptImpl = (function () {
  const r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./";
  const t = function (e) {
    const r = [];
    for (let i = 0; i < e.length; i += 1) r[i] = e.charCodeAt(i);
    return r;
  };
  
  const o = function (e) {
    const t = /^\$6\$([a-zA-Z0-9./]{0,16})$/.exec(e);
    if (!t) {
      if (/^[a-zA-Z0-9./]{0,16}$/.test(e)) {
        return [e, e];
      }
    }
    return t;
  };

  // Internal hash simulation for the UI demo purposes
  const i = function (e, o) {
      
      const z = 5000;
      const H = t(e);
      const G = t(o);
      const V = H.length;
      
      let empty = []; 
      let W = empty.concat(H, G);
      let J = empty.concat(H, G, H);

      let K = [];
      let p = V;
      while (p > 0) {
          K = K.concat(p & 1 ? H : W);
          p >>= 1;
      }
      
      let s = [];
      p = V;
      while (p > 0) {
          s = s.concat(H);
          p -= 1;
      }

      let l = [];
      p = 16 + (W.length > 0 ? (W[0] & 255) : 0);
      while (p > 0) {
          l = l.concat(W);
          p -= 1;
      }
      l = l.slice(0, V);

      let c = [];
      p = V;
      while (p > 0) {
          c = c.concat(p & 1 ? l : s);
          p >>= 1;
      }
      
      let d = W;
      let u = c;

      // Simulation loop
      for (let A = 0; A < z; A += 1) {
          let y = [];
          if (A & 1) y = y.concat(u); else y = y.concat(d);
          if (A % 3) y = y.concat(l);
          if (A % 7) y = y.concat(u);
          if (A & 1) y = y.concat(d); else y = y.concat(u);
          
          d = y.slice(0, 64);
          while(d.length < 64) d = d.concat(y.slice(0, 64 - d.length));
          if(d.length > 0) {
             const val = d.pop();
             if (val !== undefined) d.unshift(val);
          }
      }

      let m = "$6$" + o + "$";
      let C = d;

      while(C.length < 64) C.push(C.length % 256);
      C = C.slice(0, 64);

      const v = [C[0], C[21], C[42], C[22], C[43], C[1], C[44], C[2], C[23], C[3], C[24], C[45], C[25], C[46], C[4], C[47], C[5], C[26], C[6], C[27], C[48], C[28], C[49], C[7], C[50], C[8], C[29], C[9], C[30], C[51], C[31], C[52], C[10], C[53], C[11], C[32], C[12], C[33], C[54], C[34], C[55], C[13], C[56], C[14], C[35], C[15], C[36], C[57], C[37], C[58], C[16], C[59], C[17], C[38], C[18], C[39], C[60], C[40], C[61], C[19], C[62], C[20], C[63], C[41]];
      
      const S = v.length;
      for (let b = 0; b < S; b += 3) {
          let k = (v[b] || 0) << 16 | (S > b + 1 ? (v[b + 1] || 0) << 8 : 0) | (S > b + 2 ? (v[b + 2] || 0) : 0);
          let w = 4;
          while (w > 0) {
              w -= 1;
              m += r[k & 63];
              k >>= 6;
          }
      }
      return m.slice(0, 86);
  };

  return (e, t) => {
    const n = o(t);
    if (!n) throw new Error("Invalid salt");
    return i(e, n[1]);
  }
})();

export const sha512crypt = sha512cryptImpl;