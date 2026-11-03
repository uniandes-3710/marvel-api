import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('planets')
export class Planet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  name: string;
}
