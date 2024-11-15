import net from "net"
import joi from 'joi';
import { sendPacket } from "../../packet/createPacket.js";
import { config } from "../../config/config.js";


export const registerHandler = async (socket: net.Socket, payload: Object) => {
    //const {id, password, email} =     
}