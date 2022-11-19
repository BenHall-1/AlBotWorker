import { PrismaClient } from '@benhall-1/albotdb';
import { ItemName } from 'alclient';

const prisma = new PrismaClient();

type ItemUpgrade = {
  item_name: string;
  previous_level: number;
  new_level: number;
  successful: boolean;
  date: Date;
};

type MonsterAttack = {
  entity: string;
  damage: number;
  date: Date;
};

type SoldItem = {
  item: string;
  gold: number;
  date: Date;
};

const batchItemUpgradeEntries: ItemUpgrade[] = [];
const batchMonsterAttackEntries: MonsterAttack[] = [];
const batchSoldItemEntries: SoldItem[] = [];

export function LogItemUpgrade(
  item: ItemName,
  previousLevel: number,
  newLevel: number = -1,
  successful: boolean = false,
): void {
  batchItemUpgradeEntries.push({
    item_name: item,
    previous_level: previousLevel,
    new_level: newLevel,
    successful,
    date: new Date(),
  });
}

export function LogMonsterAttack(
  entity: string,
  damage: number,
) {
  batchMonsterAttackEntries.push({
    entity,
    damage,
    date: new Date(),
  });
}

export function LogItemSale(
  item: ItemName,
  gold: number,
) {
  batchSoldItemEntries.push({
    item,
    gold,
    date: new Date(),
  });
}

export async function batchCreate(): Promise<void> {
  await prisma.$connect();
  if (batchItemUpgradeEntries.length > 0) {
    await prisma.itemUpgrades.createMany({
      data: batchItemUpgradeEntries,
    });
    batchItemUpgradeEntries.splice(0, batchItemUpgradeEntries.length);
  }
  if (batchMonsterAttackEntries.length > 0) {
    await prisma.monsterAttacks.createMany({
      data: batchMonsterAttackEntries,
    });

    batchMonsterAttackEntries.splice(0, batchMonsterAttackEntries.length);
  }
  if (batchSoldItemEntries.length > 0) {
    await prisma.soldItems.createMany({
      data: batchSoldItemEntries,
    });
    batchSoldItemEntries.splice(0, batchSoldItemEntries.length);
  }
  await prisma.$disconnect();
}
