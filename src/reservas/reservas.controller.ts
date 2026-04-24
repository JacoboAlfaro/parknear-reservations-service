import {
	Body,
	Controller,
	Get,
	Param,
	ParseIntPipe,
	ParseUUIDPipe,
	Post,
	Put,
} from '@nestjs/common';
import { CreateReservaDto } from './dtos/create-reserva.dto';
import { UpdateReservaStateDto } from './dtos/update-reserva-state.dto';
import { ReservasService } from './reservas.service';
import { ReservaRecord } from './interfaces/reserva.interface';

@Controller('reservas')
export class ReservasController {
	constructor(private readonly reservasService: ReservasService) {}

	@Post()
	async create(@Body() createReservaDto: CreateReservaDto): Promise<ReservaRecord> {
		return this.reservasService.create(createReservaDto);
	}

	@Get(':id')
	async findById(@Param('id', ParseIntPipe) id: number): Promise<ReservaRecord> {
		return this.reservasService.findById(id);
	}

	@Get('user/:id')
	async findByUserId(
		@Param('id', new ParseUUIDPipe()) id: string,
	): Promise<ReservaRecord[]> {
		return this.reservasService.findByUserId(id);
	}

	@Put(':id/state')
	async updateState(
		@Param('id', ParseIntPipe) id: number,
		@Body() updateReservaStateDto: UpdateReservaStateDto,
	): Promise<ReservaRecord> {
		return this.reservasService.updateState(id, updateReservaStateDto);
	}
}
