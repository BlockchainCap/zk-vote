import { useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";

interface RegisterModalProps {
  createGroup: any;
  signedIn: boolean;
}
export const RegisterModal = (props: RegisterModalProps) => {
  const [show, setShow] = useState(false);
  const [address, setAddress] = useState("");

  const handleClose = () => setShow(false);
  const handleSubmit = async () => {
    setShow(false);
    await props.createGroup(address);
  };
  const handleShow = () => setShow(true);
  return (
    <>
      {props.signedIn ? (
        <Button
          variant="success"
          onClick={handleShow}
          style={{ float: "right" }}
        >
          Register New NFT
        </Button>
      ) : (
        ""
      )}

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
            Enter an existing NFT project contract address to start creating
            private proposals and votes.
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>Contract address</Form.Label>
              <Form.Control
                type="address"
                placeholder="0xdeadbeef..."
                autoFocus
                value={address}
                onChange={(val: any) => setAddress(val.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Create group
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
