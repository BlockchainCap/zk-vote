import {
  JsonRpcProvider,
  StaticJsonRpcProvider,
  Web3Provider,
  Provider,
  JsonRpcSigner,
} from "@ethersproject/providers";
import { Signer, VoidSigner, Wallet, Event, EventFilter } from "ethers";
import { Result } from "ethers/lib/utils";

export type TEthersProvider =
  | JsonRpcProvider
  | Web3Provider
  | StaticJsonRpcProvider;

export type TEthersProviderOrSigner =
  | JsonRpcProvider
  | Web3Provider
  | StaticJsonRpcProvider
  | Signer
  | JsonRpcSigner
  | Wallet
  | VoidSigner;

export type TEthersSigner = Signer | JsonRpcSigner | Wallet | VoidSigner;

export type TAbstractProvider = Provider;

export type TypedEventFilter<
  _EventArgsArray extends Array<any>,
  _EventArgsObject extends Record<string, any>
> = EventFilter;

export type TypedEvent<EventArgs extends Result> = Event & {
  args: EventArgs;
};
