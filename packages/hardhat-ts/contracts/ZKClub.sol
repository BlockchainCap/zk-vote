//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@appliedzkp/semaphore-contracts/interfaces/IVerifier.sol";
import "@appliedzkp/semaphore-contracts/base/SemaphoreCore.sol";
import "@appliedzkp/semaphore-contracts/base/SemaphoreGroups.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title ZKVote contract
/// @dev The following contract is a simple example of a private message board that only can
/// be accessed by holders of a given NFT. The broadcast message is just bytes so theoretically
/// any application can be built on top of this.
/// @author Ryan Sproule - Blockchain Capital Research + Engineering
contract ZKVote is SemaphoreCore, SemaphoreGroups {
  event Register(address tokenAddress, uint256 tokenId, address sender, uint256 identityCommitment);
  event CreateClub(address tokenAddress, uint256 clubId);
  event CreateProposal(address tokenAddress, uint256 clubId, bytes32 message, uint256 externalNullifier);
  event CastVote(address tokenAddress, uint256 clubId, bytes32 message, uint256 proposalId, uint256 externalNullifier);

  // relay reward could be given to the account that publishes a proof as an incentive
  // currently this is note being used
  uint256 private constant RELAY_REWARD = 0.05 ether;
  uint8 private constant DEPTH = 20;
  uint256 private constant PROP_WINDOW_BLOCKS = 1000;
  uint private numProposals = 0;

  enum MessageType {
    PROP,
    VOTE
  }

  mapping(address => mapping(uint256 => uint256)) public registrations;
  mapping(address => uint256) public clubs;
  uint256 public clubCount = 0;
  IVerifier public verifier;

  constructor(address _verifier) {
    verifier = IVerifier(_verifier);
  }

  /// @notice Inserts an identity commitment into the merkle tree that is
  /// is used in a proof to check for set inclusion
  function registerIdentity(
    address _token,
    uint256 _tokenId,
    uint256 _identityCommitment
  ) public canRegister(_token, _tokenId) {
    require(msg.sender == ERC721(_token).ownerOf(_tokenId), "ZKVote: not token owner");
    registrations[_token][_tokenId] = _identityCommitment;
    _addMember(clubs[_token], _identityCommitment);
    emit Register(_token, _tokenId, msg.sender, _identityCommitment);
  }

  /// @notice Broadcasts a generic message. This can either be a proposal or a vote atm.
  /// @dev The external nullifier here is a composite key of groupId, type, and timeWindow
  /// this prevents double spend per unique key of this group
  function broadcastMessage(
    bytes32 _signal,
    address _token,
    uint256 _nullifierHash,
    uint256 _root,
    uint256 _externalNullifier,
    uint256 _clubId,
    MessageType _messageType,
    uint256 _flexField,
    uint256[8] calldata _proof
  ) public {
    // need to use a hash function that produces output smaller than 256 bits, shift over 1 byte
    uint256 derivedNullifier = uint256(keccak256(abi.encodePacked(_clubId, _messageType, _flexField)) >> 8);
    require(_externalNullifier == derivedNullifier, "ZKVote: bad nullifier");

    if (_messageType == MessageType.PROP) {
      validateProposal(_flexField);
    } else if (_messageType == MessageType.VOTE) {
      validateVote(_signal);
    }
    _verifyProof(_signal, _root, _nullifierHash, _externalNullifier, _proof, verifier);
    _saveNullifierHash(_nullifierHash);

    // here we are simply emitting an event. This is a dummy example. In
    // a real governance contract, this is where the logic would live
    // to update the vote state or initialize the proposal.
    if (_messageType == MessageType.PROP) {
      numProposals += 1;
      emit CreateProposal(_token, clubs[_token], _signal, numProposals);
    } else if (_messageType == MessageType.VOTE) {
      emit CastVote(_token, clubs[_token], _signal, _flexField, _externalNullifier);
    }
    // Relayer reward currently not enabled
    // payable(msg.sender).transfer(RELAY_REWARD);
  }

  /// @notice Initializes a group for a give ERC721 contract
  function createClub(address _token) public {
    require(!doesClubExistForToken(_token), "ZKVote: Club exists");
    require(ERC721(_token).supportsInterface(0x80ac58cd), "ZKVote: invalid address");
    clubCount++;
    _createGroup(clubCount, DEPTH, 0);
    clubs[_token] = clubCount;
    emit CreateClub(_token, clubCount);
  }

  /// @notice Check that a proposal is actually within the window it claims
  function validateProposal(uint256 _window) internal view {
    require(_window == (block.number / PROP_WINDOW_BLOCKS), "ZKVote: Outside window");
  }

  /// @notice Check that the vote is one the valid options
  function validateVote(bytes32 vote) internal pure {
    require(vote == bytes32("YES") || vote == bytes32("NO") || vote == bytes32("ABSTAIN"), "ZKVote: Invalid vote");
  }

  /// @notice Checks that conditions are met to register a club
  modifier canRegister(address token, uint256 tokenId) {
    require(doesClubExistForToken(token), "ZKVote: Token not init");
    require(getIdentityCommitment(token, tokenId) == 0, "ZKVote: Already registered");
    _;
  }

  function getIdentityCommitment(address token, uint256 tokenId) internal view returns (uint256) {
    return registrations[token][tokenId];
  }

  function doesClubExistForToken(address token) internal view returns (bool) {
    return clubs[token] != 0;
  }
}
