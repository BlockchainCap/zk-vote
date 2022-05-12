import StepProgressBar from "react-step-progress";
import "react-step-progress/dist/index.css";
import classes from "./RegistrationFlow.module.css";
import { Container } from "react-bootstrap";
import { useEffect, useState } from "react";

interface RegistrationFlowProps {
  groupId: string | undefined;
  isMember: boolean;
  hasMinted: boolean;
  isConnected: boolean;
}
const getState = (
  ismember: boolean,
  hasminted: boolean,
  isconnected: boolean
) => {
  if (!isconnected) return 0;
  if (!hasminted && isconnected && !ismember) return 1;
  if (!ismember) return 2;
  return 3;
};
const useStep = (
  isMember: boolean,
  hasMinted: boolean,
  isConnected: boolean
) => {
  const [step, setStep] = useState<number>(0);
  useEffect(() => {
    const state = getState(isMember, hasMinted, isConnected);
    setStep(state);
  }, [hasMinted, isMember, isConnected]);
  return step;
};
export const RegistrationFlow = (props: RegistrationFlowProps) => {
  const step = useStep(props.isMember, props.hasMinted, props.isConnected);
  return (
    <Container fluid>
      <StepProgressBar
        key={step}
        primaryBtnClass={classes.hide}
        secondaryBtnClass={classes.hide}
        startingStep={step}
        onSubmit={() => {}}
        steps={[
          {
            label: "Connect Wallet",
            name: "step 0",
            content: <></>,
          },
          {
            label: "Own this NFT",
            name: "step 1",
            content: <></>,
          },
          {
            label: "Register Identity",
            name: "step 2",
            content: <></>,
          },
          {
            label: "Create Proposals and Vote",
            name: "step 3",
            content: <></>,
          },
        ]}
      />
    </Container>
  );
};
