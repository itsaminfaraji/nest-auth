import {
  PipeTransform,
  ArgumentMetadata,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value, metadata: ArgumentMetadata) {
    if (!value) {
      throw new HttpException(
        {
          data: {
            message: 'Input data validation failed',
            errors: ['No inputs received'],
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const { metatype } = metadata;
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToClass(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) {
      throw new HttpException(
        {
          data: {
            message: 'Input data validation failed',
            errors: this.buildError(errors),
          },
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return value;
  }

  private buildError(errors) {
    const result = {};
    errors.forEach(el => {
      const prop = el.property;
      Object.entries(el.constraints).forEach(constraint => {
        result[prop] = `${constraint[1]}`;
      });
    });
    return result;
  }

  private toValidate(metatype): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.find(type => metatype === type);
  }
}
