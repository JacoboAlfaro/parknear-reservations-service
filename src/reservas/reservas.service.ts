import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateReservaDto } from './dtos/create-reserva.dto';
import { UpdateReservaStateDto } from './dtos/update-reserva-state.dto';
import { ReservaRecord } from './interfaces/reserva.interface';
import { ReservasRepository } from './repositories/reservas.repository';

@Injectable()
export class ReservasService {
	constructor(private readonly reservasRepository: ReservasRepository) {}

	async create(createReservaDto: CreateReservaDto): Promise<ReservaRecord> {
		try {
			const reserva = await this.reservasRepository.create({
					id_conductor: createReservaDto.id_conductor,
					id_zona: createReservaDto.id_zona,
					id_vehiculo: createReservaDto.id_vehiculo.toUpperCase(),
					fecha_real_inicio: new Date(createReservaDto.fecha_real_inicio),
					fecha_fin: createReservaDto.fecha_fin ? new Date(createReservaDto.fecha_fin) : null,
					precio: createReservaDto.precio.toFixed(2),
					estado: createReservaDto.estado ?? 'pendiente',
				})
			;

			if (!reserva) {
				throw new BadRequestException('No se pudo crear la reserva');
			}

			return reserva;
		} catch (error: unknown) {
			this.handleDbError(error);
		}
	}

	async findById(id: number): Promise<ReservaRecord> {
		const reserva = await this.reservasRepository.findById(id);

		if (!reserva) {
			throw new NotFoundException('Reserva no encontrada');
		}

		return reserva;
	}

	async findByUserId(userId: string): Promise<ReservaRecord[]> {
		return this.reservasRepository.findByUserId(userId);
	}

	async updateState(id: number, updateReservaStateDto: UpdateReservaStateDto): Promise<ReservaRecord> {
		const existingReserva = await this.findById(id);

		const shouldSetEndDate =
			updateReservaStateDto.estado === 'completada' || updateReservaStateDto.estado === 'cancelada';

		const fechaFin = updateReservaStateDto.fecha_fin
			? new Date(updateReservaStateDto.fecha_fin)
			: shouldSetEndDate
				? new Date()
				: existingReserva.fecha_fin;

		const updatedReserva = await this.reservasRepository.updateState(
			id,
			updateReservaStateDto.estado,
			fechaFin,
		);

		if (!updatedReserva) {
			throw new NotFoundException('Reserva no encontrada');
		}

		return updatedReserva;
	}

	private handleDbError(error: unknown): never {
		const dbError = error as {
			code?: string;
			message?: string;
		};

		if (dbError?.code === '23503') {
			throw new BadRequestException(
				'No se pudo crear la reserva: conductor, vehiculo o zona no existe',
			);
		}

		if (dbError?.code === '22007') {
			throw new BadRequestException('Formato de fecha invalido');
		}

		throw error;
	}
}
