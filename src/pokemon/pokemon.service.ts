import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';

import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';

@Injectable()
export class PokemonService {
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
  ) {}

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();

    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      console.log(error);
      this.handleExceptions(error);
    }
  }

  async findAll() {
    const pokemon: Pokemon[] = await this.pokemonModel.find();
    return pokemon;
  }

  async findOne(searchTerm: string) {
    let pokemon: Pokemon;

    // Si esto es numero
    if (!isNaN(+searchTerm)) {
      pokemon = await this.pokemonModel.findOne({ no: searchTerm });
    }

    // MongoID
    if (!pokemon && isValidObjectId(searchTerm)) {
      pokemon = await this.pokemonModel.findById(searchTerm);
    }

    // Name
    if (!pokemon) {
      pokemon = await this.pokemonModel.findOne({
        name: searchTerm.toLowerCase().trim(),
      });
    }

    if (!pokemon)
      throw new NotFoundException(
        `Pokemon with id, name or no "${searchTerm}" not found`,
      );

    return pokemon;
  }

  async update(searchTerm: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(searchTerm);
    if (updatePokemonDto.name)
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
    try {
      await pokemon.updateOne(updatePokemonDto, { new: true });
      return { ...pokemon.toJSON(), ...updatePokemonDto };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string) {
    // const pokemon = await this.findOne( id );
    // await pokemon.deleteOne();
    // return { id }
    // const result = await this.pokemonModel.findByIdAndDelete( id );

    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id });
    if (deletedCount === 0)
      throw new BadRequestException(`Pokemon with "${id}" not found`);

    return;
  }

  private handleExceptions(error: any) {
    if (error.code === 11000) {
      throw new BadRequestException(
        `Pokemon exists in db ${JSON.stringify(error.keyValue)}`,
      );
    }
    throw new InternalServerErrorException(
      `Can't create Pokemon - Check server logs`,
    );
  }
}
