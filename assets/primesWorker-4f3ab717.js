(function(){"use strict";onmessage=n=>{const t=n.data.n;if(!t)return;const s=[];let e=2;for(;e<t;){let i=!0;for(let r of s)if(e%r===0){i=!1;break}i&&s.push(e),e=e+1}postMessage({primes:s})}})();
