import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { Put, Delete } from '@nestjs/common';

@ApiTags('menus')
@Controller('menus')
export class MenuController {
  constructor(private readonly menuService: MenuService) { }

  @Get(':name')
  async getMenu(@Param('name') name: string) {
    return this.menuService.getMenu(name);
  }

  @Get('')
  async getAll() {
    return this.menuService.getAllItems();
  }

  @Put('item/:id')
  async updateItem(@Param('id') id: string, @Body() body: any) {
    return this.menuService.updateItem(id, body || {});
  }

  @Delete('item/:id')
  async deleteItem(@Param('id') id: string) {
    return this.menuService.deleteItem(id);
  }

  @Post(':name')
  async replaceMenu(@Param('name') name: string, @Body() body: any) {
    return this.menuService.replaceMenu(name, Array.isArray(body) ? body : []);
  }
}
