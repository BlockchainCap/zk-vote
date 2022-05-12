import { Container, Navbar } from "react-bootstrap";

export const Footer = () => {
  return (
    <Navbar fixed="bottom" bg="light" variant="light" expand>
      <Container>
        <Navbar.Brand>
          Blockchain Capital - Research and Engineering
        </Navbar.Brand>
        <div>
          Questions? Interested in building?{" "}
          <a href="mailto:ryan@blockchain.capital">ryan@blockchain.capital</a>
          {" | "}
          <a href="https://twitter.com/sproule_">DMs are open</a>
        </div>
      </Container>
    </Navbar>
  );
};
