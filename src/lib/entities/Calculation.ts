import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Calculation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  expression!: string;

  @Column()
  result!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
