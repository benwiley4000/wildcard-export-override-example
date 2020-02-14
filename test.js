import * as compromise from './combined-export-compromise.js';
import * as niceToHave from './combined-export-fails.js';

// prints out all exports, with library-downstream overriding library-upstream
console.log('compromise:', JSON.stringify(compromise, null, 1));

// In TypeScript and Babel: refuses to compile at all
// In Chrome and Firefox: prints out only the "unambiguous" exports, strips rest
console.log('nice to have:', JSON.stringify(niceToHave, null, 1));
