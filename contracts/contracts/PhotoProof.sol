// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PhotoProof
 * @dev Decentralized photo ownership and registration contract on Ethereum Sepolia.
 * Secures proof of authorship, timestamp, and IPFS metadata hash.
 */
contract PhotoProof {
    struct PhotoRecord {
        bytes32 photoHash;       // SHA-256 hash of the photo represented as bytes32
        string ipfsCID;          // Pinata / IPFS Content Identifier of the photo
        address owner;           // Ethereum address of current legitimate owner
        uint256 timestamp;       // Block timestamp of initial registration
        bool exists;             // Registration existence flag
    }

    // Mapping from SHA-256 photo hash to photo record
    mapping(bytes32 => PhotoRecord) private photos;

    // List of photo hashes owned by each wallet address
    mapping(address => bytes32[]) private userPhotos;

    // Array of all registered photo hashes
    bytes32[] private allPhotoHashes;

    // Events
    event PhotoRegistered(
        bytes32 indexed photoHash,
        address indexed owner,
        string ipfsCID,
        uint256 timestamp
    );

    event OwnershipTransferred(
        bytes32 indexed photoHash,
        address indexed previousOwner,
        address indexed newOwner,
        uint256 timestamp
    );

    /**
     * @notice Register a new photo on-chain. Rejects duplicate hashes.
     * @param photoHash SHA-256 cryptographic hash of image bytes (bytes32)
     * @param ipfsCID Pinata IPFS Content Identifier
     */
    function registerPhoto(bytes32 photoHash, string calldata ipfsCID) external {
        require(photoHash != bytes32(0), "Invalid photo hash: cannot be zero");
        require(bytes(ipfsCID).length > 0, "IPFS CID required");
        require(!photos[photoHash].exists, "Photo hash already registered");

        photos[photoHash] = PhotoRecord({
            photoHash: photoHash,
            ipfsCID: ipfsCID,
            owner: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        userPhotos[msg.sender].push(photoHash);
        allPhotoHashes.push(photoHash);

        emit PhotoRegistered(photoHash, msg.sender, ipfsCID, block.timestamp);
    }

    /**
     * @notice Verify a photo by its SHA-256 hash.
     * @param photoHash SHA-256 cryptographic hash of the image
     * @return owner The Ethereum address that owns this photo
     * @return timestamp The Unix timestamp when the photo was registered
     * @return ipfsCID The IPFS CID for file retrieval
     * @return isRegistered True if photo is registered, false otherwise
     */
    function verifyPhoto(bytes32 photoHash)
        external
        view
        returns (
            address owner,
            uint256 timestamp,
            string memory ipfsCID,
            bool isRegistered
        )
    {
        PhotoRecord memory record = photos[photoHash];
        return (record.owner, record.timestamp, record.ipfsCID, record.exists);
    }

    /**
     * @notice Transfer ownership of a registered photo to another Ethereum wallet address.
     * @param photoHash SHA-256 cryptographic hash of the image
     * @param newOwner The recipient's Ethereum address
     */
    function transferOwnership(bytes32 photoHash, address newOwner) external {
        require(photos[photoHash].exists, "Photo not registered");
        require(photos[photoHash].owner == msg.sender, "Only current owner can transfer photo");
        require(newOwner != address(0), "New owner cannot be zero address");
        require(newOwner != msg.sender, "New owner must be different from current owner");

        address previousOwner = photos[photoHash].owner;
        photos[photoHash].owner = newOwner;

        // Add to recipient's photo list
        userPhotos[newOwner].push(photoHash);

        // Remove from sender's photo list
        _removePhotoFromUser(previousOwner, photoHash);

        emit OwnershipTransferred(photoHash, previousOwner, newOwner, block.timestamp);
    }

    /**
     * @notice Helper to remove a photo hash from a user's array.
     */
    function _removePhotoFromUser(address user, bytes32 photoHash) internal {
        bytes32[] storage userList = userPhotos[user];
        uint256 length = userList.length;
        for (uint256 i = 0; i < length; i++) {
            if (userList[i] == photoHash) {
                userList[i] = userList[length - 1];
                userList.pop();
                break;
            }
        }
    }

    /**
     * @notice Retrieve complete photo record
     * @param photoHash SHA-256 cryptographic hash
     */
    function getPhoto(bytes32 photoHash)
        external
        view
        returns (
            bytes32 hash,
            string memory ipfsCID,
            address owner,
            uint256 timestamp,
            bool exists
        )
    {
        PhotoRecord memory r = photos[photoHash];
        return (r.photoHash, r.ipfsCID, r.owner, r.timestamp, r.exists);
    }

    /**
     * @notice Retrieve all photo hashes currently registered to a specific wallet.
     * @param user Ethereum address of the owner
     */
    function getUserPhotos(address user) external view returns (bytes32[] memory) {
        return userPhotos[user];
    }

    /**
     * @notice Returns total number of registered photos.
     */
    function getTotalPhotos() external view returns (uint256) {
        return allPhotoHashes.length;
    }
}
