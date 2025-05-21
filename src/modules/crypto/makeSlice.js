import { encrypt } from "./Crypto";

const makeSlice = (controller, method) => {
    return encrypt(JSON.stringify({ controller, function: method }));
};

export default makeSlice;
