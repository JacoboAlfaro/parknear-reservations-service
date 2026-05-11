import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { estadoReservaEnum } from 'src/database/schema';

export class CreateReservaDto {
  @IsUUID()
  id_conductor!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_zona!: number;

  @IsString()
  @MaxLength(10)
  id_vehiculo!: string;

  @IsDateString() 
  fecha_real_inicio!: string;

  @IsOptional()
  @IsDateString()
  fecha_fin?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precio!: number;

  @IsOptional()
  @IsEnum(estadoReservaEnum.enumValues)
  estado?: (typeof estadoReservaEnum.enumValues)[number];
}
