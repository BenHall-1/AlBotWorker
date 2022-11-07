import { PrismaClient } from '@prisma/client';
import { ItemName } from 'alclient';

const prisma = new PrismaClient();

type UpgradeItem = {
  item_name: string;
  previous_level: number;
  new_level: number;
  successful: boolean;
  date: Date | null;
};

type AttackItem = {
  entity: string;
  damage: number;
  date: Date | null;
};

const batchUpgradeEntries: UpgradeItem[] = [];
const batchAttackEntries: AttackItem[] = [];

export function AddUpgrade(
  item: ItemName,
  previousLevel: number,
  newLevel: number = -1,
  successful: boolean = false,
): void {
  batchUpgradeEntries.push({
    item_name: item,
    previous_level: previousLevel,
    new_level: newLevel,
    successful,
    date: new Date(),
  });
}

export function AddAttack(
  entity: string,
  damage: number,
) {
  batchAttackEntries.push({
    entity,
    damage,
    date: new Date(),
  });
}

export async function batchCreate(): Promise<void> {
  if (batchUpgradeEntries.length > 0) {
    await prisma.upgrade.createMany({
      data: batchUpgradeEntries,
    });
  }
  if (batchAttackEntries.length > 0) {
    await prisma.attack.createMany({
      data: batchAttackEntries,
    });
  }
  batchUpgradeEntries.splice(0, batchUpgradeEntries.length);
  batchAttackEntries.splice(0, batchAttackEntries.length);
  await prisma.$disconnect();
}
