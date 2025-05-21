import "@/styles/styles.scss";
import { store } from "../store";
import { Provider } from "react-redux";
import type { AppProps } from "next/app";

const App = ({ Component, pageProps }: AppProps) => {
    return (
        <Provider store={store}>
            <Component {...pageProps} />
        </Provider>
    );
};

export default App;
