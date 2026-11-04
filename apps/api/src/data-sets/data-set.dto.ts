import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, MaxLength, ValidateNested } from 'class-validator';

export class DataSetPairDto {
  @IsString() @MaxLength(2000) question!: string;
  @IsString() @MaxLength(2000) answer!: string;
}

export class DataSetDto {
  @IsString() @MaxLength(200) name!: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(5000)
  @ValidateNested({ each: true }) @Type(() => DataSetPairDto)
  pairs!: DataSetPairDto[];
}
