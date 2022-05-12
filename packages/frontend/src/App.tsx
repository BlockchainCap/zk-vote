import { NavBar } from "./components/NavBar";
import { Routes, Route } from "react-router-dom";
import { GroupPage } from "./pages/GroupPage";
import { HomePage } from "./pages/HomePage";
import { Provider, createClient } from "wagmi";
import { QueryClient, QueryClientProvider } from "react-query";
import { providers } from "ethers";
import { Suspense } from "react";
import { InjectedConnector } from "wagmi/connectors/injected";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { Footer } from "./components/Footer";
import { Container } from "react-bootstrap";

const queryClient = new QueryClient();
const client = createClient({
  autoConnect: true,
  connectors: [
    new InjectedConnector(),
    new MetaMaskConnector({
      options: {
        shimDisconnect: true,
      },
    }),
  ],
  provider(config) {
    return new providers.StaticJsonRpcProvider(
      "https://eth-rinkeby.alchemyapi.io/v2/" +
        "6X8nst5K9gW4Gz4kE4Wmj0eRXFo8ORFS"
    );
  },
});

function App() {
  return (
    <Provider client={client}>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<>Loading...</>}>
          <NavBar />
          <Container style={{ marginBottom: "10vh" }}>
            <Routes>
              <Route path="" element={<HomePage />} />
              <Route path="/group/:groupId" element={<GroupPage />} />
            </Routes>
          </Container>
          <Footer />
        </Suspense>
      </QueryClientProvider>
    </Provider>
  );
}
export default App;
