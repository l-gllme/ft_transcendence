all:
	docker compose up --build

clean: 
	docker compose down --rmi all -v

fclean: clean
	docker system prune --all --force

re:	fclean all

.PHONY: all clean fclean re
