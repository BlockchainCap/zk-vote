import { Navbar, Container, Button, Row } from "react-bootstrap";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { useNetwork } from "wagmi";

export const NavBar = () => {
  const { data } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { activeChain, switchNetwork } = useNetwork();
  const { disconnect } = useDisconnect();
  return (
    <Navbar bg="dark" variant="dark" expand>
      <Container>
        <Navbar.Brand href="/">ZK Private Voting Demo</Navbar.Brand>
        {data ? (
          <div style={{ display: "inline" }}>
            <Row>
              <Button onClick={() => disconnect()}>
                Logout{" "}
                {data.address?.substring(0, 5) +
                  "..." +
                  data.address?.substring(
                    data.address.length - 2,
                    data.address.length
                  )}
              </Button>
            </Row>
            <Row>
              {activeChain && activeChain!.id === 4 ? (
                ""
              ) : (
                <Button onClick={() => switchNetwork!(4)} variant="danger">
                  Wrong chain - Switch to Rinky
                </Button>
              )}
            </Row>
          </div>
        ) : (
          <Button onClick={() => connect()}>Connect</Button>
        )}
      </Container>
    </Navbar>
  );
};
