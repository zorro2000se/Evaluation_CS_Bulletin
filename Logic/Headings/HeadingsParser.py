__author__ = 'Till'
from FontAbbrvSize import FontAbbrvSize
from HeadingsDB import HeadingsDB
import os.path
from Logic import Parser
""" Parses and validates headings file. Returns headingsDB """
class HeadingsParser:

    def __init__(self):
        self.headingsDB = HeadingsDB()
        pass

    def parse(self, file_path):
        assert os.path.isfile(file_path), "Heading doesn't exist. Please create " + repr(file_path)
        tree = Parser.parse_dtd(file_path)
        bulletin = tree.getroot()

        for heading in bulletin:
            heading_name = heading.get("name")
            font_abbrv_size = self.__get_fontabbrvsize_struct(heading)
            self.headingsDB.add(font_abbrv_size, heading_name)

        return self.headingsDB

    def __get_fontabbrvsize_struct(self, heading):
        font_abbrv = heading.get("fontabbrv")
        font_size = heading.get("fontsize")
        return FontAbbrvSize(font_abbrv, font_size)