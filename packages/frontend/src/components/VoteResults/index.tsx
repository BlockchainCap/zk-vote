import { ProgressBar } from "react-bootstrap";

interface ResultsProps {
  votesYes: number;
  votesNo: number;
  votesAbstain: number;
}
export const Results = (props: ResultsProps) => {
  const votesYes = props.votesYes;
  const votesNo = props.votesNo;
  const votesAbstain = props.votesAbstain;
  const sum = votesAbstain + votesNo + votesYes;
  return (
    <>
      For
      <div style={{ float: "right" }}>{`${votesYes} votes For | ${(
        (votesYes / sum) *
        100
      ).toFixed(2)}%`}</div>
      <ProgressBar variant="success" now={(votesYes / sum) * 100} />
      Against
      <div style={{ float: "right" }}>{`${votesNo} votes Against | ${(
        (votesNo / sum) *
        100
      ).toFixed(2)}%`}</div>
      <ProgressBar variant="danger" now={(votesNo / sum) * 100} />
      Abstain
      <div style={{ float: "right" }}>{`${votesAbstain} votes Abstained | ${(
        (votesAbstain / sum) *
        100
      ).toFixed(2)}%`}</div>
      <ProgressBar variant="secondary" now={(votesAbstain / sum) * 100} />
    </>
  );
};
