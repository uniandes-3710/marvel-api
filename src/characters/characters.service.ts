import { Injectable } from '@nestjs/common';
import { CreateCharacterDto } from './dto/create-character.dto.js';
import { UpdateCharacterDto } from './dto/update-character.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Character } from './entities/character.entity.js';
import { Repository } from 'typeorm/browser/repository/Repository.js';

@Injectable()
export class CharactersService {
  constructor(
    @InjectRepository(Character)
    private readonly charactersRepo: Repository<Character>,
  ) {}

  create(createCharacterDto: CreateCharacterDto) {
    return 'This action adds a new character';
  }

  async findAll(limit: number, page: number) {
    // let personajes = await this.charactersRepo.find({
    //   order: { alias: 'ASC' },
    //   take: 10,
    // });

    return await this.charactersRepo
      .createQueryBuilder('character')
      .limit(limit)
      .offset((page - 1) * limit)
      .getMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} character`;
  }

  update(id: number, updateCharacterDto: UpdateCharacterDto) {
    return `This action updates a #${id} character`;
  }

  remove(id: number) {
    return `This action removes a #${id} character`;
  }
}
