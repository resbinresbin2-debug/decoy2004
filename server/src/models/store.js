const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const RealUser = require("./User");
const RealPhoto = require("./Photo");

// In-memory collections for local/dev resilience
const memoryUsers = [];
const memoryPhotos = [];

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

class MemoryQuery {
  constructor(items) {
    this.items = [...items];
  }
  populate(field, select) {
    this.items = this.items.map((item) => {
      const owner = memoryUsers.find((u) => u._id.toString() === item.owner?.toString());
      return {
        ...item,
        owner: owner ? { _id: owner._id, name: owner.name, email: owner.email, avatar: owner.avatar } : null,
      };
    });
    return this;
  }
  sort(criteria) {
    this.items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return this;
  }
  limit(n) {
    this.items = this.items.slice(0, n);
    return this;
  }
  then(resolve, reject) {
    return Promise.resolve(this.items).then(resolve, reject);
  }
  catch(reject) {
    return Promise.resolve(this.items).catch(reject);
  }
}

// Memory User Model Adapter
const UserStore = {
  findOne(filter) {
    if (isMongoConnected()) {
      return RealUser.findOne(filter);
    }
    const email = filter.email?.toLowerCase();
    const googleId = filter.googleId;
    const found = memoryUsers.find(
      (u) => (email && u.email === email) || (googleId && u.googleId === googleId)
    );

    const queryObj = {
      select: () => queryObj,
      then: (resolve, reject) => {
        if (!found) return resolve(null);
        return resolve({
          ...found,
          comparePassword: async (pwd) => bcrypt.compare(pwd, found.password || ""),
          save: async () => found,
        });
      },
      catch: (reject) => {},
    };
    return queryObj;
  },

  findById(id) {
    if (isMongoConnected()) {
      return RealUser.findById(id);
    }
    const found = memoryUsers.find((u) => u._id.toString() === id?.toString());
    const queryObj = {
      select: () => queryObj,
      then: (resolve) => resolve(found || null),
      catch: (reject) => {},
    };
    return queryObj;
  },

  async create(data) {
    if (isMongoConnected()) {
      return RealUser.create(data);
    }
    let hashedPassword = data.password;
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(data.password, salt);
    }
    const newUser = {
      _id: `mem_user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: data.name,
      email: data.email?.toLowerCase(),
      password: hashedPassword,
      googleId: data.googleId || null,
      avatar:
        data.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name || "User")}`,
      walletAddress: data.walletAddress || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      comparePassword: async (pwd) => bcrypt.compare(pwd, hashedPassword || ""),
      save: async function () {
        return this;
      },
    };
    memoryUsers.push(newUser);
    return newUser;
  },

  async findByIdAndUpdate(id, update, options = {}) {
    if (isMongoConnected()) {
      return RealUser.findByIdAndUpdate(id, update, options);
    }
    const user = memoryUsers.find((u) => u._id.toString() === id?.toString());
    if (!user) return null;
    if (update.walletAddress) {
      user.walletAddress = update.walletAddress.toLowerCase();
    }
    const resObj = {
      ...user,
      select: () => user,
    };
    return resObj;
  },
};

// Memory Photo Model Adapter
const PhotoStore = {
  findOne(filter) {
    if (isMongoConnected()) {
      return RealPhoto.findOne(filter);
    }
    const hash = filter.sha256Hash?.toLowerCase();
    const found = memoryPhotos.find((p) => p.sha256Hash === hash);

    const queryObj = {
      populate: (field, select) => {
        if (!found) return queryObj;
        const owner = memoryUsers.find((u) => u._id.toString() === found.owner?.toString());
        return {
          ...found,
          owner: owner ? { _id: owner._id, name: owner.name, email: owner.email, avatar: owner.avatar } : null,
          save: async function () {
            return this;
          },
          then: (resolve) =>
            resolve({
              ...found,
              owner: owner ? { _id: owner._id, name: owner.name, email: owner.email, avatar: owner.avatar } : null,
            }),
          catch: () => {},
        };
      },
      then: (resolve) => resolve(found || null),
      catch: (reject) => {},
    };
    return queryObj;
  },

  find(query = {}) {
    if (isMongoConnected()) {
      return RealPhoto.find(query);
    }
    let filtered = [...memoryPhotos];

    if (query.$or) {
      filtered = filtered.filter((p) => {
        return query.$or.some((clause) => {
          if (clause.owner && p.owner?.toString() === clause.owner?.toString()) return true;
          if (
            clause.walletAddress &&
            p.walletAddress?.toLowerCase() === clause.walletAddress?.toLowerCase()
          )
            return true;
          return false;
        });
      });
    }

    return new MemoryQuery(filtered);
  },

  async create(data) {
    if (isMongoConnected()) {
      return RealPhoto.create(data);
    }
    const newPhoto = {
      _id: `mem_photo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: data.title,
      description: data.description || "",
      authorName: data.authorName || "Anonymous Creator",
      sha256Hash: data.sha256Hash?.toLowerCase(),
      pHash: data.pHash,
      ipfsCID: data.ipfsCID,
      ipfsUrl: data.ipfsUrl,
      txHash: data.txHash,
      blockNumber: data.blockNumber || null,
      walletAddress: data.walletAddress?.toLowerCase(),
      owner: data.owner,
      fileSize: data.fileSize || 0,
      mimeType: data.mimeType || "image/jpeg",
      blockchainTimestamp: data.blockchainTimestamp || Math.floor(Date.now() / 1000),
      transferHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      save: async function () {
        return this;
      },
    };
    memoryPhotos.unshift(newPhoto);
    return newPhoto;
  },

  async countDocuments(query = {}) {
    if (isMongoConnected()) {
      return RealPhoto.countDocuments(query);
    }
    if (query.$or) {
      return memoryPhotos.filter((p) => {
        return query.$or.some((clause) => {
          if (clause.owner && p.owner?.toString() === clause.owner?.toString()) return true;
          if (
            clause.walletAddress &&
            p.walletAddress?.toLowerCase() === clause.walletAddress?.toLowerCase()
          )
            return true;
          return false;
        });
      }).length;
    }
    return memoryPhotos.length;
  },
};

module.exports = {
  UserStore,
  PhotoStore,
  isMongoConnected,
};
