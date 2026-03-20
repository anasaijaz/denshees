import instance from "./axios";

const fetcher = (...args) => instance.get(...args);

export default fetcher;
