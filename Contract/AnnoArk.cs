﻿using System;
using Neo.SmartContract.Framework;
using Neo.SmartContract.Framework.Services.Neo;
using Helper = Neo.SmartContract.Framework.Helper;
using System.ComponentModel;
using System.Numerics;

namespace AnnoArk
{
	public class AnnoArk : SmartContract
    {
		public static class Const
        {
			public const float cityMoveSpeed = 150;
			public const float raidCityCargoRate = 0.1f;
			public const float safeZoneLine = 1567;
			public const float damagePerAttackCity = 0.1f;
			public const float energyCostPerLyExpand = 0.01f;
			public const float nukemissSpeed = 3600;
			public const float nukeRadius = 120;
			public const float totalPirateCnt = 1000;
			public const float pirateCargoC0 = 100;
			public const float pirateArmyC0 = 10;
			public const float piratePeriodTimestamp = 0;
			public static User[] allUserList = new User[];
			public static Island[] allIslands = new Island[];
			public static string[] allCargoNameList = new string[];
        }

		public static class Utils
		{
			#region Utils Storage

			public static byte[] KeyPath(params string[] elements)
			{
				if (elements.Length == 0)
				{
					return new byte[0];
				}
				else
				{
					byte[] r = elements[0].AsByteArray();
					for (int i = 1; i < elements.Length; i++)
					{
						r = r.Concat(elements[i].AsByteArray());
					}
					return r;
				}

				//return string.Join(Const.Splitter, elements);
			}

			public static byte[] KeyPath(byte[] splitter, params string[] elements)
			{
				if (elements.Length == 0)
				{
					return new byte[0];
				}
				else
				{
					byte[] r = elements[0].AsByteArray();
					for (int i = 1; i < elements.Length; i++)
					{
						r = r.Concat(splitter).Concat(elements[i].AsByteArray());
					}
					return r;
				}
			}
			public static byte[] GetStorageWithKeyPath(params string[] elements)
			{
				return GetStorageWithKey(KeyPath(elements));
			}
			public static byte[] GetStorageWithKey(byte[] key)
			{
				return Storage.Get(Storage.CurrentContext, key);
			}
			public static byte[] GetStorageWithKey(string key)
			{
				return Storage.Get(Storage.CurrentContext, key);
			}

			public static byte SetStorageWithKeyPath(byte[] value, params string[] elements)
			{
				return SetStorageWithKey(KeyPath(elements), value);
			}
			public static byte SetStorageWithKey(string key, byte[] value)
			{
				return SetStorageWithKey(key.AsByteArray(), value);
			}

			public static byte SetStorageWithKey(byte[] key, byte[] value)
			{
				byte[] orig = GetStorageWithKey(key);
				if (orig == value) { return State.Unchanged; }

				if (value.Length == 0)
				{
					Storage.Delete(Storage.CurrentContext, key);
					return State.Delete;

				}
				else
				{
					Storage.Put(Storage.CurrentContext, key, value);
					return (orig.Length == 0) ? State.Create : State.Update;
				}
			}

			#endregion
		}
        
		[Serializable]
		public class LocationData{
			public BigInteger speed;
			public BigInteger lastLocationX;
			public BigInteger lastLocationY;
			public BigInteger destinationX;
			public BigInteger destinationY;
			public BigInteger lastLocationTime;
		}

		[Serializable]
		public class User{
			public byte[] address;
			public byte[] nickname;
			public byte[] country;
			public BigInteger hull;
			public BigInteger expandCnt;
			public LocationData locationData;
		}
        
        [Serializable]
        public class Island
        {
			public BigInteger index;
			public BigInteger x;
			public BigInteger y;
			public byte[] occupant;
            public BigInteger lastMineTime;
            public BigInteger money;
			public byte[] sponsorName;
			public byte[] sponsorLink;
            public BigInteger miningRate;
            public BigInteger mineBalance;
            public BigInteger lastCalcTime;
        }

        [Serializable]
        public class Pirate
        {
			public BigInteger index;
			public BigInteger respawnTimestamp;
			public bool alive;
        }

		#region Main
		public static readonly byte[] Owner = "AQZSaHrJfwj8AYH38FdC6zR1TQhcAdm5SE".ToScriptHash();

		public static object Main(string operation, params object[] args)
        {
			if (Runtime.Trigger == TriggerType.Verification){
				if(Owner.Length == 20){
					return Runtime.CheckWitness(Owner);
				}
				else if (Owner.Length == 33){
					byte[] signature = operation.AsByteArray();
                    return VerifySignature(signature, Owner);
				}
				return true;
			}
			else if(Runtime.Trigger == TriggerType.Application){
				if (operation == "userRegister")
                {// Register new user, will generate a few cards thereof

                    return UserRegister(args);
                }

				if (operation == "editUser")
                {
					return editUser(args);
                }

				if (operation == "move")
                {
                    return move(args);
                }

				if (operation == "expand")
                {
                    return expand(args);
                }

				if (operation == "build")
                {
                    return build(args);
                }

				if (operation == "upgradeBuilding")
                {
                    return upgradeBuilding(args);
                }

				if (operation == "demolish")
                {
                    return demolish(args);
                }

				if (operation == "produce")
                {
                    return produce(args);
                }

				if (operation == "attackPirate")
                {
                    return attackPirate(args);
                }

				if (operation == "attackIsland")
                {
                    return attackIsland(args);
                }

				if (operation == "collectIslandMoney")
                {
                    return collectIslandMoney(args);
                }

                if (operation == "getNumUsers")
                {
					return GetNumUsers();
                }

				if (operation == "getIslandInfo")
                {
					return true;
                }
				if(operation == "getUserIDByAddr"){
					if (args.Length < 1) return 0;
					byte[] addr = (byte[])args[0];
					return GetUserIDByAddr(addr);
				}

                byte[] r = new byte[1];

                return r;
			}
			else{   //Will elabrate for other cases
				return false;
			}

        }
		#endregion


		#region User

		private static User BytesToUser(byte[] bytes)
        {
            if (bytes.Length == 0)
            {
                return null;
            }
            else
            {
                object[] objs = (object[])Helper.Deserialize(bytes);
                return (User)(object)objs;
            }
        }

        private static byte[] UserToBytes(User user)
        {
            return Helper.Serialize(user);
        }

        private static byte SetUser(BigInteger id, User user)
        {
			return Utils.SetStorageWithKey(Const.PxUser + id.ToString(), UserToBytes(user));
        }

		public static bool UserRegister(params object[] args){
			if (args.Length < 2) return false;

			byte[] from = (byte[])args[0];
			if(!Runtime.CheckWitness(from)){
				return false;
			}
			else{
				if (GetUserIDByAddr(from)!=0){
					//User already registered
					return false;
				}
				//If logic goes here, this is a new user. 

				//Update global.
				Global global = GetGlobal();
				BigInteger newUserId = global.numUsers;
				global.numUsers = BigInteger.Add(global.numUsers,1);
				global = SyncGlobal(global);

                //Put new user into storage
				User user = new User();
				user.address = from;
				user.name = (byte[])args[1];
				Utils.SetStorageWithKey(Const.PxUser + newUserId.ToString(), UserToBytes(user));

                //Generate new user some basic cards
				int seed = Blockchain.GetHeader(Blockchain.GetHeight()).GetHashCode();

				SetGlobal(global);
				return true;
			}
		}

		public static bool UserRename(params object[] args){
			if (args.Length < 2) return false;
			byte[] from = (byte[])args[0];
			if (!Runtime.CheckWitness(from))
            {
                return false;
            }
			else{
				BigInteger id = GetUserIDByAddr(from);
				User user = GetUserById(id);
				user.name = (byte[])args[1];
				SetUser(id,user);
				return true;
			}
		}      

		public static BigInteger GetUserIDByAddr(byte[] addr)
        {
			for (BigInteger i = 1; i < GetGlobal().numUsers; i++){
				if(GetUserById(i).address == addr){
					return i;
				}
			}
			return 0;
        }

		public static User GetUserByAddr(byte[] addr){
			for (BigInteger i = 1; i < GetGlobal().numUsers; i++)
            {
				User u = GetUserById(i);
                if (u.address == addr)
                {
                    return u;
                }
            }
			return null; 
		}

		public static byte[] GetUserRawById(BigInteger uid)
        {
			return Utils.GetStorageWithKey(Const.PxUser + uid.ToString());
        }

		public static User GetUserById(BigInteger uid){
			return BytesToUser(GetUserRawById(uid));
		}

		#endregion


		//=====Bancor of floatmod
		public static void bancorTrade(cargoName, b) {
			let value = Blockchain.transaction.value;
			let userAddress = Blockchain.transaction.from;
			let user = this.allUsers.get(userAddress);
			if (user === null) {
				throw new Error("User NOT FOUND.");
			}
			let A = this.bancorInfos.get(cargoName + 'A');
			let K = this.bancorInfos.get(cargoName + 'K');
			let X = this.bancorInfos.get(cargoName + 'X');
			if (b > 0) { //buy
				//check value
				let c = A / K * (Math.exp(K * (X + b)) - Math.exp(K * X));
				if (value < c * 1e18) {
					throw new Error("Value NOT ENOUGH to buy. need " + c + ".You give " + value);
				}
				//return exceeded part
				let returnMoney = (value - c * 1e18);
				if (returnMoney > 1e-4) {
					let returnWei = new BigNumber(Math.floor(returnMoney / 1e8) * 1e8);
					this._transaction(userAddress, returnWei);
				}

				//add cargo
				this._userAddCargo(user, cargoName, b);
			} else if (b < 0) { //sell
				user.cargoData[cargoName] -= b;
				if (user.cargoData[cargoName] < 0) {
					throw new Error("Your cargo NOT ENOUGH " + (user.cargoData[cargoName] + b));
				}
				let Fee = this.bancorInfos.get(cargoName + 'Fee');
				let c = A / K * (Math.exp(K * X) - Math.exp(K * (X + b)));
				let money = new BigNumber(Math.floor(c * (1 - Fee) * 1e10) * 1e8);
				this._transaction(userAddress, money);
			}
			//set x
			X += b;
			if (X < 0 && b < 0) {
				throw new Error("Bid demand NOT ENOUGH." + X);
			}
			this.bancorInfos.set(cargoName + 'X', X);
			//set User
			this.allUsers.set(userAddress, user);
			return {
				"success": true,
			};
		};
		public static void setBancorInfo(cargoName, A, K, X, Fee) {
			if (Blockchain.transaction.from != this.adminAddress) {
				throw new Error("Permission denied.");
			}
			this.bancorInfos.set(cargoName + 'A', A);
			this.bancorInfos.set(cargoName + 'K', K);
			this.bancorInfos.set(cargoName + 'X', X);
			this.bancorInfos.set(cargoName + 'Fee', Fee);
			return {
				"success": true,
			};
		};
		public static void getBancorInfo(cargoName) {
			let A = this.bancorInfos.get(cargoName + 'A');
			let K = this.bancorInfos.get(cargoName + 'K');
			let X = this.bancorInfos.get(cargoName + 'X');
			let Fee = this.bancorInfos.get(cargoName + 'Fee');
			return {
				cargoName: cargoName,
				A: A,
				K: K,
				X: X,
				Fee: Fee,
			}
		};

		public static Global GetGlobal(){
			byte[] raw = Utils.GetStorageWithKey("G");
			if(raw.Length == 0){
				Global g = new Global();
				SetGlobal(g);
				return g;
        
			}
			else{
				object[] objs = (object[])Helper.Deserialize(raw);
				return (Global)(object)objs;
			}
		}

		public static byte SetGlobal(Global global){
			return Utils.SetStorageWithKey("G",Helper.Serialize(global));
		}

		public static Global SyncGlobal(Global global){
			Utils.SetStorageWithKey("G", Helper.Serialize(global));
			return global;
		}

		public static BigInteger GetNumUsers()
        {
			return GetGlobal().numUsers;
        }

        public static BigInteger GetNumIslands()
        {
			return GetGlobal().numIslands;
        }

    }
}
