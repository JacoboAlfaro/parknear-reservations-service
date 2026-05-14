import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateReservaDto } from './dtos/create-reserva.dto';
import { UpdateReservaStateDto } from './dtos/update-reserva-state.dto';
import { ReservaRecord } from './interfaces/reserva.interface';
import { ReservasRepository } from './repositories/reservas.repository';

@Injectable()
export class ReservasService {
	constructor(private readonly reservasRepository: ReservasRepository) {}

	private calcularPrecio(fechaInicio: Date, fechaFin: Date): number {
		const diffMs = fechaFin.getTime() - fechaInicio.getTime();
		const diffHours = Math.max(0, diffMs / (1000 * 60 * 60));
		return Number((diffHours * 3500).toFixed(2));
	}

	async create(createReservaDto: CreateReservaDto): Promise<ReservaRecord> {
		try {
			const fechaInicio = new Date();
			const fechaFin = new Date(createReservaDto.fecha_fin);
			const precio = this.calcularPrecio(fechaInicio, fechaFin);

			const reserva = await this.reservasRepository.create({
					id_conductor: createReservaDto.id_conductor,
					id_zona: createReservaDto.id_zona,
					id_vehiculo: createReservaDto.id_vehiculo.toUpperCase(),
					fecha_real_inicio: fechaInicio,
					fecha_fin: fechaFin,
					precio: precio.toString(),
					estado: 'pendiente',
				});

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

		let fechaInicio = existingReserva.fecha_real_inicio;
		if (existingReserva.estado === 'pendiente' && updateReservaStateDto.estado === 'activa') {
			fechaInicio = new Date();
		}

		const fechaFin = updateReservaStateDto.fecha_fin
			? new Date(updateReservaStateDto.fecha_fin)
			: shouldSetEndDate
				? new Date()
				: existingReserva.fecha_fin;

		const nuevoPrecio = this.calcularPrecio(fechaInicio, fechaFin ? new Date(fechaFin) : new Date());

		const updatedReserva = await this.reservasRepository.updateStateWithPrice(
			id,
			updateReservaStateDto.estado,
			fechaFin,
			fechaInicio,
			nuevoPrecio.toString()
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
