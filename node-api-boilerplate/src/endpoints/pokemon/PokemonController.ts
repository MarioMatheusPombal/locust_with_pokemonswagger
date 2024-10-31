import { Request, Response } from 'express';
import { PokemonRepository } from './Pokemon.repository';
import { Pokemon } from './Pokemon.entity';

export class PokemonController {
  /**
   * @swagger
   * /pokemon:
   *   post:
   *     summary: Cria um novo Pokémon
   *     tags: [Pokemon]
   *     consumes:
   *       - application/json
   *     produces:
   *       - application/json
   *     requestBody:
   *         description: Dados necessários para criar um Pokémon
   *         required: true
   *         content:
   *           application/json:
   *              schema:
   *                type: object
   *                properties:
   *                  name:
   *                    type: string
   *                    description: Nome do Pokémon
   *                    example: Pikachu
   *                  type:
   *                    type: string
   *                    description: Tipo do Pokémon
   *                    example: Elétrico
   *     responses:
   *       '201':
   *         description: Pokémon criado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: string
   *       '500':
   *         description: Falha ao criar o Pokémon
   */
  async create(req: Request, res: Response): Promise<void> {
    const { name, type } = req.body;

    const pokemon = new Pokemon();
    pokemon.name = name;
    pokemon.type = type;

    const createdPokemon = await new PokemonRepository().insert(pokemon);

    if (createdPokemon) {
      res.status(201).json({ data: pokemon });
    } else {
      res.status(500).json({ data: 'Erro ao criar Pokémon.' });
    }
  }

  /**
   * @swagger
   * /pokemon:
   *   get:
   *     summary: Retorna a lista de Pokémons cadastrados
   *     tags: [Pokemon]
   *     consumes:
   *       - application/json
   *     produces:
   *       - application/json
   *     responses:
   *       '200':
   *          description: Lista de Pokémons retornados com sucesso
   *          content:
   *            application/json:
   *              schema:
   *                type: object
   *                properties:
   *                  data:
   *                    type: object
   *       '500':
   *          description: Erro interno do servidor
   */
  async list(req: Request, res: Response): Promise<Response> {
    try {
      // Extrair parâmetros de consulta com valores padrão
      let { page = '1', limit = '10' } = req.query;

      // Converter para números e validar
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);

      if (isNaN(pageNumber) || pageNumber < 1) {
        return res.status(400).json({ message: 'Parâmetro "page" inválido.' });
      }

      if (isNaN(limitNumber) || limitNumber < 1) {
        return res.status(400).json({ message: 'Parâmetro "limit" inválido.' });
      }

      const repository = new PokemonRepository();

      // Calcular o número de itens a pular
      const skip = (pageNumber - 1) * limitNumber;

      // Obter os Pokémons com paginação
      const [items, total] = await repository.findAndCount({
        skip,
        take: limitNumber,
        order: { name: 'ASC' }, // Ordenar por nome de forma ascendente (opcional)
      });

      const totalPages = Math.ceil(total / limitNumber);

      const pokemons = {
        items,
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages,
      };

      return res.status(200).json({ data: pokemons });
    } catch (error) {
      console.error('Erro ao listar Pokémons:', error);
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }

  /**
   * @swagger
   * /pokemon/count:
   *   get:
   *     summary: Retorna a contagem total de Pokémon
   *     tags: [Pokemon]
   *     consumes:
   *       - application/json
   *     produces:
   *       - application/json
   *     responses:
   *       '200':
   *          description: Contagem de Pokémon retornada com sucesso
   *          content:
   *            application/json:
   *              schema:
   *                type: object
   *                properties:
   *                  total:
   *                    type: number
   *       '500':
   *          description: Erro interno do servidor
   */
  async count(req: Request, res: Response) {
    const total = await new PokemonRepository().count();

    return res.status(200).send({ total });
  }

  /**
   * @swagger
   * /pokemon/{name}:
   *   get:
   *     summary: Retorna um Pokémon específico pelo nome
   *     tags: [Pokemon]
   *     consumes:
   *       - application/json
   *     produces:
   *       - application/json
   *     parameters:
   *       - in: path
   *         name: name
   *         required: true
   *         description: Nome do Pokémon que deseja buscar
   *         schema:
   *           type: string
   *     responses:
   *       '200':
   *          description: Pokémon encontrado com sucesso
   *          content:
   *            application/json:
   *              schema:
   *                type: object
   *                properties:
   *                  data:
   *                    type: object
   *       '404':
   *          description: Pokémon não encontrado
   *       '500':
   *          description: Erro interno do servidor
   */
  async getOne(req: Request, res: Response) {
    const name = req.params.name;

    const pokemon = await new PokemonRepository().findOne({ where: { name } });

    return res.status(pokemon ? 200 : 404).send({ data: pokemon });
  }

  /**
   * @swagger
   * /pokemon:
   *   delete:
   *     summary: Remove todos os Pokemóns cadastrados
   *     tags: [Pokemon]
   *     consumes:
   *       - application/json
   *     produces:
   *       - application/json
   *     responses:
   *       '200':
   *          description: Pokemons excluídos com sucesso
   *          content:
   *            application/json:
   *              schema:
   *                type: object
   *                properties:
   *                  data:
   *                    type: string
   *       '500':
   *          description: Erro interno do servidor
   */
  async delete(req: Request, res: Response) {
    await new PokemonRepository().clear();
    return res.status(200).send({ data: 'Pokemons excluídos com sucesso!' });
  }
}
